import express from "express";
import { verify } from "../middleware.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../database/users.js";

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        let { username, password, email, account_type, client_key } = req;

        const decryptedUsername = (await decryptData(username)).toString('utf8');
        const decryptedPassword = (await decryptData(password)).toString('utf8');
        const decryptedEmail = (await decryptData(email)).toString('utf8');
        const decryptedAccountType = (await decryptData(account_type)).toString('utf8');

        username = decryptedUsername;
        password = decryptedPassword;
        email = decryptedEmail;
        account_type = decryptedAccountType;

        if (username === "") return res.status(400).json({ message: "Please enter a username" });
        const sanitizedUsername = validator.escape(username);
        const existingUser = await User.findOne({ name: sanitizedUsername });
        if (existingUser) return res.status(400).json({ message: "Username already exists" });

        if (!validator.isEmail(email)) return res.status(400).json({ message: "Please enter a valid email" });
        const sanitizedEmail = validator.normalizeEmail(email);
        const existingEmail = await User.findOne({ email: sanitizedEmail });
        if (existingEmail) return res.status(400).json({ message: "Email already exists" });

        if (password === "") return res.status(400).json({ message: "Please enter a password" });
        const sanitizedPassword = validator.trim(password);
        const hashedPassword = bcrypt.hashSync(sanitizedPassword, 12);

        const accountTypeOptions = ["student", "teacher", "admin", "teacher-assistant"];
        if (!accountTypeOptions.includes(account_type.toLowerCase())) return res.status(400).json({ message: "Please enter a valid account type" });

        const newMember = new User({
            name: sanitizedUsername,
            email: sanitizedEmail,
            account_type: account_type,
            password: hashedPassword,
            completed_2fa: false,
            register_time: Date.now()
        });

        await newMember.save();
        return res.json({ message: "You are now registered", user_id: await encryptData(client_key, newMember._id) });
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