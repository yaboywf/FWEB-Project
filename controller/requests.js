import express from "express";
import { checkRequiredKeys, verify } from '../middleware';
import Pair from '../database/pairs.js';

const router = express.Router();

router.get('/requests', verify, async (req, res) => {
    const pairs = await Pair.find({
        $or: [{ sender_id: req.user.student_id }, { receiver_id: req.user.student_id }],
        status: 1
    });

    return res.json(pairs);
})

router.post('/add', verify, checkRequiredKeys('body', ["receiver_id", "module", "day", "start_time", "end_time"]), async (req, res) => {
    await Pair.create({
        sender_id: req.user.student_id,
        receiver_id: req.body.receiver_id,
        module: req.body.module,
        day: Number(req.body.day),
        start_time: req.body.start_time,
        end_time: req.body.end_time,
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
    });

    if (!pair) return res.status(404).json({ message: "Pair not found or you are not authorized to update this pair" });
    return res.json({ message: "Pair successfully updated" });
})

router.put('/update-details', verify, checkRequiredKeys('body', ["_id", "module", "day", "start_time", "end_time"]), async (req, res) => {
    const pair = await Pair.findOneAndUpdate({
        _id: req.body.id,
        status: 2,
        $or: [
            { sender_id: req.user.student_id },
            { receiver_id: req.user.student_id }
        ]
    }, {
        module: body.module || "",
        day: Number(body.day) || 0,
        start_time: body.start_time || "",
        end_time: body.end_time || "",
    });

    if (!pair) return res.status(404).json({ message: "Pair not found or you are not authorized to update this pair" });
    return res.json({ message: "Pair successfully updated" });    
})

export default router;