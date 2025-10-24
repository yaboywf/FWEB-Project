import express from "express";
import { verify, checkRequiredKeys } from "../middleware.js";
import User from "../database/users.js";
import Achievement from "../database/achievements.js";
import Attained from "../database/attained.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.get("/information", verify, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const account = await User.findOne({ student_id: req.query.id });
    if (!account) return res.status(404).json({ message: "Account not found" });

    return res.json(account);
})

router.get("/all-achievements", verify, async (req, res) => {
    const achievements = await Achievement.find({ student_id: req.user.student_id }).sort({ difficulty: 1 });
    return res.json(achievements);
})

router.get("/attained-achievements", verify, async (req, res) => {
    const achievements = await Attained.find({ student_id: req.user.student_id });
    return res.json(achievements);
})

router.post("/rating", verify, checkRequiredKeys('body', ["student_id", "rating"]), async (req, res) => {
    if (req.user.student_id === req.body.student_id) return res.status(400).json({ message: "Cannot rate yourself" });
    if (req.body.rating < 1 || req.body.rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });

    await User.findOneAndUpdate(
        { student_id: req.body.student_id },
        { $push: { rating: req.body.rating } },
    );

    return res.json({ message: "Rating submitted successfully" });
})

router.put("/update", verify, checkRequiredKeys('body', ["diploma", "year_of_study"]), async (req, res) => {
    try {
        const { diploma, year_of_study, image } = req.body;
        const updatedAccount = await User.findOneAndUpdate(
            { student_id: req.user.student_id },
            {
                diploma,
                year_of_study,
                ...(image && { image })
            },
        );

        if (!updatedAccount) return res.status(404).json({ message: "Account not found" });
        return res.json({ message: "User Information successfully updated" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
})

router.post("/change-password", verify, checkRequiredKeys('body', ["current_password", "new_password"]), async (req, res) => {
    const user = await User.findOne({ student_id: req.user.student_id });
    if (!user) return res.status(404).json({ message: "Account not found" });

    const isMatch = await bcrypt.compare(req.body.current_password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.new_password, salt);

    user.password = hashedPassword;
    await user.save();

    return res.json({ message: "Password reset successfully" });
})

export default router;