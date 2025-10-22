import express from "express";
import { checkRequiredKeys, verify } from "../middleware.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../database/users.js";

const router = express.Router();

router.post("/register", checkRequiredKeys('body', ["student_id", "password", "name", "year_of_study", "diploma"]), async (req, res) => {
    try {
        const { student_id, password, year_of_study, diploma, name } = req.body;

        await User.create({
            student_id,
            name,
            password: await bcrypt.hash(password, 10),
            year_of_study,
            diploma
        });

        return res.json({ message: "You are now registered" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { student_id, password } = req.body;

        const user = await User.findOne({ student_id });
        if (!user) return res.status(401).end();

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).end();

        const token = jwt.sign(
            { mongoose_id: user._id, student_id: user.student_id, name: user.name, year_of_study: user.year_of_study, diploma: user.diploma },
            process.env.JWT_SECRET,
            { expiresIn: "3h", audience: "http://localhost:5173", issuer: "http://localhost:3000" }
        );

        const userCopy = { ...user };
        delete userCopy.password;
        return res.json({ token, user: userCopy });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
});

router.get("/verify", verify, (req, res) => {
    return res.json({ user: req.user });
});

export default router;