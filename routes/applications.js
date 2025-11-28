import express from "express";
import pool from "../db.js";

const router = express.Router();

/* -----------------------------
   POST /api/applications
   Student applies to internship
--------------------------------*/
router.post("/", async (req, res) => {
    try {
        const { internship_id, student_id } = req.body;

        if (!internship_id || !student_id) {
            return res.status(400).json({
                status: "error",
                message: "internship_id and student_id are required"
            });
        }

        // Check duplicate application
        const [existing] = await pool.query(
            "SELECT id FROM applications WHERE internship_id = ? AND student_id = ?",
            [internship_id, student_id]
        );

        if (existing.length > 0) {
            return res.json({
                status: "ok",
                message: "You already applied for this internship"
            });
        }

        // Insert application
        await pool.query(
            `INSERT INTO applications (internship_id, student_id, status, cover_letter) 
             VALUES (?, ?, 'applied', '')`,
            [internship_id, student_id]
        );

        res.json({
            status: "ok",
            message: "Application submitted successfully"
        });
    } catch (err) {
        console.error("APPLICATION POST ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

/* ------------------------------------
   GET /api/applications/student/:id
-------------------------------------*/
router.get("/student/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        const [rows] = await pool.query(
            `SELECT 
                a.id,
                a.internship_id,
                a.status,
                a.created_at AS applied_at
             FROM applications a
             WHERE a.student_id = ?
             ORDER BY a.created_at DESC`,
            [studentId]
        );

        res.json({ status: "ok", applications: rows });
    } catch (err) {
        console.error("APPLICATIONS STUDENT ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

/* ------------------------------------
   GET /api/applications/employer/:id
-------------------------------------*/
router.get("/employer/:id", async (req, res) => {
    try {
        const employerId = req.params.id;

        const [rows] = await pool.query(
            `SELECT 
                a.id,
                a.internship_id,
                a.status,
                a.created_at AS applied_at,
                u.email AS studentEmail
             FROM applications a
             JOIN internships i ON a.internship_id = i.id
             JOIN students s ON a.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE i.employer_id = ?
             ORDER BY a.created_at DESC`,
            [employerId]
        );

        res.json({ status: "ok", applications: rows });
    } catch (err) {
        console.error("APPLICATIONS EMPLOYER ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

/* ------------------------------------
   GET /api/applications/all (Admin)
-------------------------------------*/
router.get("/all", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                a.id,
                a.internship_id,
                a.status,
                a.created_at AS applied_at,
                u.email AS studentEmail
             FROM applications a
             JOIN students s ON a.student_id = s.id
             JOIN users u ON s.user_id = u.id
             ORDER BY a.created_at DESC`
        );

        res.json({ status: "ok", applications: rows });
    } catch (err) {
        console.error("APPLICATIONS ALL ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

/* ------------------------------------
   PATCH /api/applications/:id/status
-------------------------------------*/
router.patch("/:id/status", async (req, res) => {
    try {
        const appId = req.params.id;
        const { status } = req.body;

        const normalized = (status || "").toLowerCase();

        if (!["pending", "accepted", "rejected"].includes(normalized)) {
            return res
                .status(400)
                .json({ status: "error", message: "Invalid status value" });
        }

        await pool.query(
            "UPDATE applications SET status = ? WHERE id = ?",
            [normalized, appId]
        );

        res.json({ status: "ok", message: "Status updated" });
    } catch (err) {
        console.error("APPLICATION STATUS ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

export default router;
