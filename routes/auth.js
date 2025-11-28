import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
    try {
        const { role, name, email, password } = req.body;

        if (!role || !name || !email || !password)
            return res.status(400).json({ status: "error", message: "Missing fields" });

        const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0)
            return res.status(400).json({ status: "error", message: "Email already registered" });

        const hash = await bcrypt.hash(password, 10);

        await db.query(
            "INSERT INTO users (role, name, email, password_hash) VALUES (?, ?, ?, ?)",
            [role, name, email, hash]
        );

        res.json({ status: "ok", message: "Signup successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (rows.length === 0)
            return res.status(400).json({ status: "error", message: "Invalid email" });

        const user = rows[0];

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match)
            return res.status(400).json({ status: "error", message: "Incorrect password" });

        res.json({
            status: "ok",
            user: {
                id: user.id,
                role: user.role,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

export default router;
