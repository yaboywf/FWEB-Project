import express from 'express';
import { checkRequiredKeys, verify } from '../middleware.js';
import Pair from '../database/pairs.js';

const router = express.Router();

router.get('/pairs', verify, async (req, res) => {
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
    ])

    return res.json(pairs);
})

router.delete('/delete', verify, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const pair = await Pair.findOneAndDelete({
        _id: req.query.id,
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