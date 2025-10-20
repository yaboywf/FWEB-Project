import express from 'express';
import { checkRequiredKeys, verify } from '../middleware';
import Pair from '../database/pairs.js';

const router = express.Router();

router.get('/pairs', verify, async (req, res) => {
    const pairs = await Pair.find({
        $or: [{ sender_id: req.user.student_id }, { receiver_id: req.user.student_id }],
        status: 2
    });

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