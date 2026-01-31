import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

import { router as proficiencyRoutes } from "./controller/proficiency.js";
import accountRoutes from "./controller/account.js";
import authRoutes from "./controller/auth.js";
import { router as pairRoutes } from "./controller/pairs.js";
import requestRoutes from "./controller/requests.js";

dotenv.config({ debug: false, quiet: true });
const app = express();

mongoose.set("strictQuery", true);
const DB_URI = process.env.DB_CONNECT;
const RETRY_DELAY = 5000;

async function connectWithRetry() {
    try {
        await mongoose.connect(DB_URI);
        console.log("✅ Connected to DB!");
    } catch (err) {
        console.error("❌ DB connection failed. Retrying in 5 seconds...");
        console.error(err.message);

        setTimeout(connectWithRetry, RETRY_DELAY);
    }
}

connectWithRetry();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
    origin: ["https://teach-and-tackle.onrender.com", "http://localhost:5173"],
    credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/proficiency", proficiencyRoutes);
app.use("/api/pair", pairRoutes);
app.use("/api/request", requestRoutes);

app.listen(3000, (err) => {
    if (err) console.error(err);
    console.log(`✅ Server running`)
});