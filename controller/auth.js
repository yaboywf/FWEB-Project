import express from "express";
import { checkRequiredKeys, verify, writeLimiter } from "../middleware.js";
import jwt from "jsonwebtoken";
import User from "../database/users.js";
import { ConfidentialClientApplication, LogLevel } from "@azure/msal-node";
import axios from "redaxios";

const router = express.Router();

const msalClient = new ConfidentialClientApplication({
    auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
    system: { loggerOptions: { logLevel: LogLevel.Error } }
});

const scopes = ["openid", "profile", "email", "offline_access", "User.Read"];

router.post("/register", checkRequiredKeys('body', ["student_id", "name", "year_of_study", "diploma"]), async (req, res) => {
    try {
        const { student_id, year_of_study, diploma, name } = req.body;

        await User.create({
            student_id,
            name,
            year_of_study,
            diploma
        });

        return res.json({ message: "You are now registered" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
});

router.get("/login", writeLimiter, async (req, res) => {
    try {
        const returnUrl = req.query.return_url || "https://teach-and-tackle.onrender.com";

        const authUrl = await msalClient.getAuthCodeUrl({
            scopes,
            redirectUri: process.env.AZURE_REDIRECT_URI,
            responseMode: "query",
            prompt: "select_account",
            state: encodeURIComponent(returnUrl),
        });
        res.redirect(authUrl);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
});

router.get("/verify", verify, writeLimiter, (req, res) => {
    return res.json({ user: req.user });
});

router.post("/logout", verify, writeLimiter, (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
    });
    return res.json({ message: "Logged out successfully" });
});


router.get("/callback", writeLimiter, async (req, res) => {
    try {
        const tokenResp = await msalClient.acquireTokenByCode({
            code: req.query.code,
            scopes,
            redirectUri: process.env.AZURE_REDIRECT_URI,
        });

        const c = tokenResp.idTokenClaims;
        const email = c?.preferred_username;

        if (!email) return res.status(400).send("Email not provided by Microsoft");

        const allowedDomains = "student.tp.edu.sg";
        const emailDomain = email.split("@")[1]?.toLowerCase();
        if (!allowedDomains.includes(emailDomain)) return res.status(400).send("Email domain not allowed. Please use your student email.");

        const student_id = email.split("@")[0].toUpperCase();
        if (!/^[0-9]{7}[A-Za-z]$/.test(student_id)) return res.status(400).send("Invalid student ID");

        const profileResp = await axios.get("https://graph.microsoft.com/v1.0/me", {
            headers: { Authorization: `Bearer ${tokenResp.accessToken}` },
        });

        const user = await User.findOne({ student_id }).select("-password");
        if (!user) return res.redirect(`https://teach-and-tackle.onrender.com/register?student_id=${encodeURIComponent(student_id)}&name=${encodeURIComponent(profileResp.data.displayName || "")}`);

        user.name = profileResp.data.displayName || "";
        await user.save();

        try {
            const photoResp = await axios.get("https://graph.microsoft.com/v1.0/me/photo/$value", {
                headers: { Authorization: `Bearer ${tokenResp.accessToken}` },
                responseType: "arraybuffer",
            });

            if (photoResp.status === 200) {
                const photoBase64 = Buffer.from(photoResp.data).toString("base64");
                user.image = `data:image/jpeg;base64,${photoBase64}`;
            } else {
                user.image = null;
            }
        } catch {
            user.image = null;
        }

        await user.save();

        const sessionJwt = jwt.sign(
            {
                uid: user._id.toString(),
                name: user.name,
                mongoose_id: user._id,
                student_id: user.student_id,
                year_of_study: user.year_of_study,
                diploma: user.diploma
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d", audience: process.env.DEV ? `http://localhost:${process.env.FRONTEND_PORT}` : "https://teach-and-tackle.onrender.com", issuer: process.env.DEV ? `https://localhost:${process.env.BACKEND_PORT}` : "https://fweb-project.onrender.com" }
        );

        res.cookie("token", sessionJwt, {
            httpOnly: true,
            secure: process.env.DEV ? false : true,
            sameSite: process.env.DEV ? "lax" : "None",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const redirectBack = req.query.state ? decodeURIComponent(req.query.state) : "https://teach-and-tackle.onrender.com/explore";
        return res.redirect(redirectBack);
    } catch (e) {
        console.error(e);
        if (e.message.includes("AADSTS54005")) return res.redirect(`https://teach-and-tackle.onrender.com/login`);
        res.status(400).send("Authentication error");
    }
});

export default router;