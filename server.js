import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "https://localhost:5173",
    credentials: true,
}));

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/proficiency", proficiencyRoutes);
app.use("/api/pairs", pairRoutes);
app.use("/api/requests", requestRoutes);

app.listen(3000, (err) => {
    if (err) console.error(err);
    console.log(`Server running`)
});