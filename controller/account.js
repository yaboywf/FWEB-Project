import express from "express";
import { verify, checkRequiredKeys, writeLimiter } from "../middleware.js";
import User from "../database/users.js";
import Achievement from "../database/achievements.js";
import Attained from "../database/attained.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Proficiency from "../database/proficiency.js";
import dotenv from "dotenv";
dotenv.config();

const SYSTEM_PROMPT = `
You are "TackleBot" — an chatbot and assistant for the Teach & Tackle website.
Teach and Tackle is a platform for Temasek Polytechnic students to find peers who excel in modules that you are struggling in.
Your purpose:
- Explain academic topics simply
- Provide study tips
- Suggest peer-learning methods
- Stay within school-related topics

Rules:
- If the user asks about unrelated topics (politics, medical, hacking, etc),
  reply: "Please ask something related to Teach & Tackle."
- Be encouraging, friendly, and youth-friendly.
- Keep answers short and clear.
- Be as helpful as possible.
- If unsure of an answer, you must always refer to the Temasek Polytechnic website.
`;
const router = express.Router();
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.get("/information", verify, writeLimiter, checkRequiredKeys('query', ["id"]), async (req, res) => {
    const account = await User.findOne({ student_id: { $eq: req.query.id } });
    if (!account) return res.status(404).json({ message: "Account not found" });

    return res.json(account);
})

router.get("/all-achievements", verify, writeLimiter, async (req, res) => {
    const achievements = await Achievement.find({ student_id: req.user.student_id }).sort({ difficulty: 1 });
    return res.json(achievements);
})

router.get("/attained-achievements", verify, writeLimiter, async (req, res) => {
    const achievements = await Attained.find({ student_id: req.user.student_id });
    return res.json(achievements);
})

router.post("/rating", verify, writeLimiter, checkRequiredKeys('body', ["student_id", "rating"]), async (req, res) => {
    if (req.user.student_id === req.body.student_id) return res.status(400).json({ message: "Cannot rate yourself" });
    if (req.body.rating < 1 || req.body.rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });

    await User.findOneAndUpdate(
        { student_id: { $eq: req.body.student_id } },
        { $push: { rating: req.body.rating } },
    );

    return res.json({ message: "Rating submitted successfully" });
})

router.put("/update", verify, writeLimiter, checkRequiredKeys('body', ["diploma", "year_of_study"]), async (req, res) => {
    try {
        const { diploma, year_of_study } = req.body;
        if (typeof diploma !== "string" || typeof year_of_study !== "number") {
            return res.status(400).json({ message: "Invalid input types for diploma or year_of_study" });
        }

        const updatedAccount = await User.findOneAndUpdate(
            { student_id: { $eq: req.user.student_id } },
            {
                diploma,
                year_of_study,
            },
        );

        if (!updatedAccount) return res.status(404).json({ message: "Account not found" });
        return res.json({ message: "User Information successfully updated" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
})

router.post("/ai", verify, writeLimiter, checkRequiredKeys('body', ["message"]), async (req, res) => {
    try {
        const { message } = req.body;
        const proficiencies = await Proficiency.find({ student_id: { $eq: req.query.id } }).populate("module_id");
        
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent([
            { role: "system", content: SYSTEM_PROMPT },
            { role: "system", content: `User module: ${JSON.stringify(proficiencies) ?? "Unknown"}` },
            { role: "system", content: `User: ${JSON.stringify(req.user)}` },
            { role: "user", content: message }
        ]);
        const reply = result.response.text();

        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: "AI error", detail: err.message });
    }
});

export default router;