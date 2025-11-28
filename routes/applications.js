 import express from "express";
import pool from "../db.js";

const router = express.Router();

// student applies
router.post("/", async (req, res) => {
    try {
        const { internship_id, student_id } = req.body;

        if (!internship_id || !student_id) {
            return res.json({ status: "error", message: "Missing fields" });
        }

        await pool.query(
            "INSERT INTO applications (student_id, internship_id, status) VALUES (?, ?, 'pending')",
            [student_id, internship_id]
        );

        res.json({ status: "ok", message: "Application submitted" });

    } catch (err) {
        console.error("APPLY ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// view student applications
router.get("/student/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        const [rows] = await pool.query(
            `SELECT 
                a.id,
                a.status,
                i.title AS internship_title
             FROM applications a
             JOIN internships i ON a.internship_id = i.id
             WHERE a.student_id = ?
             ORDER BY a.id DESC`,
            [studentId]
        );

        res.json({ status: "ok", applications: rows });

    } catch (err) {
        console.error("LOAD APPS ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

export default router;
