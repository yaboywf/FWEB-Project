import express from 'express';
import { checkRequiredKeys, verify, writeLimiter } from '../middleware.js';
import Pair from '../database/pairs.js';
import Proficiency from '../database/proficiency.js';
import Attained from '../database/attained.js';
import { Types } from 'mongoose';

const router = express.Router();

router.get('/pairs', verify, writeLimiter, async (req, res) => {
    const studentId = req.user.student_id;
    const pairs = await Pair.aggregate([
        {
            $match: {
                $or: [
                    { sender_id: studentId },
                    { receiver_id: studentId }
                ],
                status: 2
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "sender_id",
                foreignField: "student_id",
                as: "sender_info"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "receiver_id",
                foreignField: "student_id",
                as: "receiver_info"
            }
        },
        {
            $lookup: {
                from: "modules",
                localField: "module_id",
                foreignField: "_id",
                as: "module_info"
            }
        },
        { $unwind: { path: "$sender_info", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$receiver_info", preserveNullAndEmptyArrays: true } },
        { $unwind: { path: "$module_info", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                created_at: { $toDate: "$_id" }
            }
        }
    ])

    for (const pair of pairs) {
        const prof = await Proficiency.findOne({ student_id: req.user.student_id, module: new Types.ObjectId(pair.module_id), type: 2 });
        pair.learner = !!prof;
    }

    const uniqueModules = [...new Set(pairs.map(p => p.module_info?._id?.toString()))];
    if (uniqueModules.length >= 3) {
        await Attained.updateOne(
            {
                student_id: studentId,
                achievement_id: new Types.ObjectId("68f9a37ae52d1f0ea134392f"),
            },
            { $setOnInsert: { achieved_date: new Date() } },
            { upsert: true }
        );
    }

    const sessionCounts = {};
    for (const p of pairs) {
        const other = p.sender_id === studentId ? p.receiver_id : p.sender_id;
        sessionCounts[other] = (sessionCounts[other] || 0) + 1;
    }

    const sameStudent = Object.values(sessionCounts).some(count => count >= 3);
    if (sameStudent) {
        await Attained.updateOne(
            {
                student_id: studentId,
                achievement_id: new Types.ObjectId("68f99971e52d1f0ea134392b"),
            },
            { $setOnInsert: { achieved_date: new Date() } },
            { upsert: true }
        );
    }

    return res.json(pairs);
})

router.delete('/delete', verify, writeLimiter, checkRequiredKeys('query', ["id"]), async (req, res) => {
    if (!Types.ObjectId.isValid(id)) return res.status(400).send("Invalid or missing ID");

    const pair = await Pair.findOneAndDelete({
        _id: new Types.ObjectId(req.query.id),
        status: 2,
        $or: [
            { sender_id: req.user.student_id },
            { receiver_id: req.user.student_id }
        ]
    });

    if (!pair) return res.status(404).json({ message: "Pair not found or you are not authorized to delete this pair" });
    return res.json({ message: "Pair successfully deleted" });
})

export default router;