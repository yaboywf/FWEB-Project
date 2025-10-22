import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import proficiencyRoutes from "./controller/proficiency.js";
import accountRoutes from "./controller/account.js";
import authRoutes from "./controller/auth.js";
import pairRoutes from "./controller/pairs.js";
import requestRoutes from "./controller/requests.js";

dotenv.config({ debug: false });
const app = express();

mongoose.set("strictQuery", true);
mongoose.connect(process.env.DB_CONNECT)
    .then(() => console.log("Connected to DB!"))
    .catch((err) => console.error(err));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
    origin: "https://localhost:5173",
    credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/proficiency", proficiencyRoutes);
app.use("/api/pair", pairRoutes);
app.use("/api/request", requestRoutes);
app.use(express.static(process.cwd() + '/dist'));
app.get(/.*/, (_, res) => {
    res.sendFile(process.cwd() + '/dist/index.html');
});

app.listen(3000, (err) => {
    if (err) console.error(err);
    console.log(`Server running`)
});