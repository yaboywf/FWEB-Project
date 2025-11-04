import express from "express";
import { verify, checkRequiredKeys, writeLimiter } from "../middleware.js";
import Proficiency from "../database/proficiency.js";
import Module from "../database/modules.js";
import User from "../database/users.js";
import { Types } from "mongoose";

const router = express.Router();

router.get("/all-modules", verify, writeLimiter, async (req, res) => {
    const modules = await Module.find();
    return res.json(modules);
})

router.get("/user-proficiency", verify, writeLimiter, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const proficiency = await Proficiency.find({ student_id: { $eq: req.query.id } }).populate("module_id");
    return res.json(proficiency);
})

router.get("/matchable-accounts", verify, writeLimiter, async (req, res) => {
    const userProficiencies = await Proficiency.find({ student_id: req.user.student_id });

    const strengthIds = userProficiencies.filter(p => p.type === 1).map(p => p.module_id);
    const weaknessIds = userProficiencies.filter(p => p.type === 2).map(p => p.module_id);

    const query = {
        $and: [
            { student_id: { $ne: req.user.student_id } },
            {
                $or: [
                    { type: 2, module_id: { $in: strengthIds } },
                    { type: 1, module_id: { $in: weaknessIds } }
                ]
            }
        ]
    };

    const data = await Proficiency.find(query).populate("module_id");
    const studentIds = [...new Set(data.map(item => item.student_id.toUpperCase()))];
    if (studentIds.length === 0) return res.status(200).json([]);

    const users = await User.find({ student_id: { $in: studentIds } }).select("-password").lean();
    const proficiencies = await Proficiency.find({ student_id: { $in: studentIds } }).populate("module_id").sort({ type: 1, module: 1 }).lean();

    const result = users.map((user) => ({
        ...user,
        proficiencies: proficiencies.filter(p => p.student_id.toUpperCase() === user.student_id.toUpperCase())
    }));

    return res.status(200).json(result);
})

router.post("/add", verify, writeLimiter, checkRequiredKeys('body', ["type", "id"]), async (req, res) => {
    const { type, id } = req.body;
    if (!Types.ObjectId.isValid(id)) return res.status(400).send("Invalid or missing ID");

    const mod = await Module.findById(id);
    if (!mod) return res.status(404).json({ message: "Module not found" });

    const proficiency = await Proficiency.findOne({ student_id: req.user.student_id, module_id: mod._id, type: Number(type) });
    if (proficiency) return res.status(400).json({ message: "Proficiency already exists" });

    const newProficiency = await Proficiency.create({
        student_id: req.user.student_id,
        type: Number(type) || 0,
        module_id: mod._id,
    })

    const populated = await Proficiency.findById(newProficiency._id).populate("module_id");
    return res.status(200).json({ message: "Proficiency successfully created", proficiency: populated });
})

router.delete("/remove", verify, writeLimiter, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const { id } = req.query;
    if (!Types.ObjectId.isValid(id)) return res.status(400).send("Invalid or missing ID");

    const proficiency = await Proficiency.findOne({ student_id: { $eq: req.user.student_id }, _id: new Types.ObjectId(id) });
    if (!proficiency) return res.status(404).json({ message: "Proficiency not found" });

    await Proficiency.deleteOne({ _id: { $eq: id } });
    return res.status(200).json({ message: "Proficiency successfully deleted" });
})

export default router;