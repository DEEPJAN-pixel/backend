// routes/auth.js (ESM, fully fixed)

import express from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

// =======================
// SIGNUP
// =======================
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ status: "error", message: "Missing fields" });
        }

        // check duplicate
        const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (exists.length > 0) {
            return res.json({ status: "error", message: "Email already exists" });
        }

        const hash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hash, role]
        );

        res.json({ status: "ok", message: "Account created", userId: result.insertId });

    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// =======================
// LOGIN
// =======================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);

        if (rows.length === 0) {
            return res.json({ status: "error", message: "Invalid email or password" });
        }

        const user = rows[0];

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.json({ status: "error", message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "secret123",
            { expiresIn: "7d" }
        );

        res.json({
            status: "ok",
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

export default router;
