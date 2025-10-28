import express from "express";
import { verify, checkRequiredKeys } from "../middleware.js";
import Proficiency from "../database/proficiency.js";
import Module from "../database/modules.js";
import User from "../database/users.js";
import { Types } from "mongoose";

const router = express.Router();

router.get("/all-modules", verify, async (req, res) => {
    const modules = await Module.find();
    return res.json(modules);
})

router.get("/user-proficiency", verify, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const proficiency = await Proficiency.find({ student_id: req.query.id }).populate("module_id");
    for (const prof of proficiency) {
        await prof.save();
    }
    return res.json(proficiency);
})

router.get("/matchable-accounts", verify, checkRequiredKeys('query', ["strength", "weakness"]), async (req, res) => {
    const strengths = req.query.strength.split(',') || [];
    const weaknesses = req.query.weakness.split(',') || [];

    const strengthIds = strengths
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));

    const weaknessIds = weaknesses
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));

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

    const users = await User.find({ student_id: { $in: studentIds } }).select("-password");
    const proficiencies = await Proficiency.find({ student_id: { $in: studentIds } }).populate("module_id").sort({ type: 1, module: 1 }).lean();

    for (const user of users) {
        await user.save();
    }

    const result = users.map((user) => ({
        ...user.toObject(),
        proficiencies: proficiencies.filter(p => p.student_id.toUpperCase() === user.student_id.toUpperCase())
    }));

    return res.status(200).json(result);
})

router.post("/add", verify, checkRequiredKeys('body', ["type", "id"]), async (req, res) => {
    const { type, id } = req.body;

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

router.delete("/remove", verify, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const { id } = req.query;

    const proficiency = await Proficiency.findOne({ student_id: req.user.student_id, _id: id });
    if (!proficiency) return res.status(404).json({ message: "Proficiency not found" });

    await Proficiency.deleteOne({ _id: id });
    return res.status(200).json({ message: "Proficiency successfully deleted" });
})

export default router;