import express from "express";
import { verify, checkRequiredKeys } from "../middleware.js";
import User from "../database/users.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.get("/account-information", verify, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const account = await User.findOne({ student_id: req.query.id });
    if (!account) return res.status(404).json({ message: "Account not found" });

    return res.json(account);
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