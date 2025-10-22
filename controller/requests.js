import express from "express";
import { checkRequiredKeys, verify } from '../middleware.js';
import Pair from '../database/pairs.js';
import { Types } from "mongoose";

const router = express.Router();

router.get('/requests', verify, async (req, res) => {
    const studentId = req.user.student_id;
    const pairs = await Pair.aggregate([
        {
            $match: {
                $or: [
                    { sender_id: studentId },
                    { receiver_id: studentId }
                ],
                status: 1
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
    ]);

    return res.json(pairs);
})

router.get('/sent', verify, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const pairs = await Pair.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(req.query.id),
                status: 1,
                sender_id: req.user.student_id
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

    return res.json(pairs[0]);
})

router.post('/add', verify, checkRequiredKeys('body', ["receiver_id", "end_date", "module_id", "day", "start_time", "end_time"]), async (req, res) => {
    await Pair.create({
        sender_id: req.user.student_id,
        receiver_id: req.body.receiver_id,
        module_id: new Types.ObjectId(req.body.module_id),
        day: Number(req.body.day),
        start_time: req.body.start_time,
        end_time: req.body.end_time,
        end_date: req.body.end_date,
        status: 1
    })

    return res.json({ message: "Request successfully created" });
})

router.delete('/remove', verify, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const pair = await Pair.findOneAndDelete({
        _id: req.query.id,
        status: 1,
        $or: [
            { sender_id: req.user.student_id },
            { receiver_id: req.user.student_id }
        ]
    });

    if (!pair) return res.status(404).json({ message: "Pair not found or you are not authorized to delete this pair" });
    return res.json({ message: "Pair successfully deleted" });
})

router.put('/update-status', verify, checkRequiredKeys('body', ["id"]), async (req, res) => {
    const pair = await Pair.findOneAndUpdate({
        _id: req.body.id,
        status: 1,
        $or: [
            { sender_id: req.user.student_id },
            { receiver_id: req.user.student_id }
        ]
    }, { status: 2 });

    if (!pair) return res.status(404).json({ message: "Request not found or you are not authorized to update this pair" });
    return res.json({ message: "Request successfully updated" });
})

router.put('/update-details', verify, checkRequiredKeys('body', ["id", "module_id", "day", "start_time", "end_time", "end_date"]), async (req, res) => {
    const body = req.body;
    const pair = await Pair.findOneAndUpdate({
        _id: new Types.ObjectId(body.id),
        status: 1,
        sender_id: req.user.student_id
    }, {
        module_id: body.module_id || "",
        day: Number(body.day) || 0,
        start_time: body.start_time || "",
        end_time: body.end_time || "",
        end_date: body.end_date || ""
    });

    if (!pair) return res.status(404).json({ message: "Request not found or you are not authorized to update this pair" });
    return res.json({ message: "Request successfully updated" });
})

export default router;