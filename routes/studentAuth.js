import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";    // <-- FIXED PATH (same style as all routes)
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// -----------------------------
// STUDENT REGISTER
// -----------------------------
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ status: "error", message: "Missing fields" });

    try {
        const hashedPass = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO students (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPass]
        );

        res.json({ status: "ok", message: "Student registered successfully" });
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ status: "error", message: "Email already exists or DB error" });
    }
});

// -----------------------------
// STUDENT LOGIN
// -----------------------------
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await pool.query(
        "SELECT * FROM students WHERE email = ?",
        [email]
    );

    if (rows.length === 0)
        return res.status(400).json({ status: "error", message: "Student not found" });

    const student = rows[0];
    const isValid = await bcrypt.compare(password, student.password);

    if (!isValid)
        return res.status(400).json({ status: "error", message: "Incorrect password" });

    const token = jwt.sign(
        { id: student.id, role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({
        status: "ok",
        message: "Login successful",
        token,
        student: {
            id: student.id,
            name: student.name,
            email: student.email,
            role: "student"
        }
    });
});

export default router;
