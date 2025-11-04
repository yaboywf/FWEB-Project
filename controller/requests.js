import express from "express";
import { checkRequiredKeys, verify, writeLimiter } from '../middleware.js';
import Pair from '../database/pairs.js';
import Attained from "../database/attained.js";
import { Types } from "mongoose";

const router = express.Router();

router.get('/requests', verify, writeLimiter, async (req, res) => {
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

    const received = pairs.filter(pair => pair.receiver_id === studentId);
    if (received.length >= 3) {
        await Attained.updateOne(
            {
                student_id: studentId,
                achievement_id: new Types.ObjectId("68f9a351e52d1f0ea134392e"),
            },
            { $setOnInsert: { achieved_date: new Date() } },
            { upsert: true }
        );
    }

    return res.json(pairs);
})

router.get('/sent', verify, writeLimiter, checkRequiredKeys('query', ["id"]), async (req, res) => {
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

router.post('/add', verify, writeLimiter, checkRequiredKeys('body', ["receiver_id", "end_date", "module_id", "day", "start_time", "end_time"]), async (req, res) => {
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

router.delete('/remove', verify, writeLimiter, checkRequiredKeys('query', ["id"]), async (req, res) => {
    if (!Types.ObjectId.isValid(id)) return res.status(400).send("Invalid or missing ID");

    const pair = await Pair.findOneAndDelete({
        _id: new Types.ObjectId(req.query.id),
        status: 1,
        $or: [
            { sender_id: req.user.student_id },
            { receiver_id: req.user.student_id }
        ]
    });

    if (!pair) return res.status(404).json({ message: "Pair not found or you are not authorized to delete this pair" });
    return res.json({ message: "Pair successfully deleted" });
})

router.put('/update-status', verify, writeLimiter, checkRequiredKeys('body', ["id"]), async (req, res) => {
    if (!Types.ObjectId.isValid(req.body.id)) return res.status(400).send("Invalid or missing ID");

    const pair = await Pair.findOneAndUpdate({
        _id: new Types.ObjectId(req.body.id),
        status: 1,
        $or: [
            { sender_id: req.user.student_id },
            { receiver_id: req.user.student_id }
        ]
    }, { status: 2 });

    if (!pair) return res.status(404).json({ message: "Request not found or you are not authorized to update this pair" });

    await Attained.updateOne(
        {
            student_id: pair.receiver_id,
            achievement_id: new Types.ObjectId("68f9986fe52d1f0ea1343929"),
        },
        { $setOnInsert: { achieved_date: new Date() } },
        { upsert: true }
    );

    await Attained.updateOne(
        {
            student_id: pair.sender_id,
            achievement_id: new Types.ObjectId("68f9986fe52d1f0ea1343929"),
        },
        { $setOnInsert: { achieved_date: new Date() } },
        { upsert: true }
    );

    const createdAt = pair._id.getTimestamp();
    const now = new Date();
    const difference = (now - createdAt) / (1000 * 60 * 60);
    if (difference <= 24) {
        await Attained.updateOne(
            {
                student_id: pair.sender_id,
                achievement_id: new Types.ObjectId("68f998f6e52d1f0ea134392a"),
            },
            { $setOnInsert: { achieved_date: new Date() } },
            { upsert: true }
        );

        await Attained.updateOne(
            {
                student_id: pair.receiver_id,
                achievement_id: new Types.ObjectId("68f998f6e52d1f0ea134392a"),
            },
            { $setOnInsert: { achieved_date: new Date() } },
            { upsert: true }
        );
    }

    return res.json({ message: "Request successfully updated" });
})

router.put('/update-details', verify, writeLimiter, checkRequiredKeys('body', ["id", "module_id", "day", "start_time", "end_time", "end_date"]), async (req, res) => {
    const body = req.body;
    if (!Types.ObjectId.isValid(body.id)) return res.status(400).send("Invalid or missing ID");
    if (!Types.ObjectId.isValid(body.module_id)) return res.status(400).send("Invalid or missing module_id");
    const day = Number(body.day);
    if (isNaN(day)) return res.status(400).send("Invalid day");
    if (typeof body.start_time !== 'string' || typeof body.end_time !== 'string') return res.status(400).send("Invalid time or date format");
    
    const pair = await Pair.findOneAndUpdate({
        _id: new Types.ObjectId(body.id),
        status: 1,
        sender_id: req.user.student_id
    }, {
        module_id: body.module_id || "",
        day: Number(body.day) || 0,
        start_time: body.start_time || "",
        end_time: body.end_time || "",
        end_date: body.end_date || new Date()
    });

    if (!pair) return res.status(404).json({ message: "Request not found or you are not authorized to update this pair" });
    return res.json({ message: "Request successfully updated" });
})

export default router;