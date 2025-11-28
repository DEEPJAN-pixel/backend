const express = require("express");
const router = express.Router();
const pool = require("../db");

// =======================
// POST /api/applications
// Student applies for an internship
// =======================
router.post("/", async (req, res) => {
    try {
        const { internship_id, student_id } = req.body;

        if (!internship_id || !student_id) {
            return res
                .status(400)
                .json({ status: "error", message: "internship_id and student_id are required" });
        }

        // prevent duplicate applications (same student + same internship)
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

        // insert application and copy internship title into row
        await pool.query(
            "UPDATE applications SET status = ? WHERE id = ?",
            [status, appId]
        );

        // NEW: create notification for the student
        if (status === "accepted" || status === "rejected") {
            await pool.query(
                `INSERT INTO notifications (user_id, type, message)
     VALUES (?, 'application', ?)`,
                [
                    studentId, // make sure you have this from the application row
                    status === "accepted"
                        ? `Your application for "${internshipTitle}" was accepted.`
                        : `Your application for "${internshipTitle}" was rejected.`
                ]
            );
        }
        res.json({
            status: "ok",
            message: "Application submitted successfully"
        });
    } catch (err) {
        console.error("APPLICATION POST ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// =======================
// GET /api/applications/student/:id
// All applications for a specific student
// =======================
router.get("/student/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        const [rows] = await pool.query(
            `
      SELECT 
        id,
        internship_id,
        internship_title,
        status,
        applied_at
      FROM applications
      WHERE student_id = ?
      ORDER BY applied_at DESC
      `,
            [studentId]
        );

        res.json({ status: "ok", applications: rows });
    } catch (err) {
        console.error("APPLICATIONS STUDENT ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// =======================
// GET /api/applications/employer/:id
// All applications for internships posted by this employer
// =======================
router.get("/employer/:id", async (req, res) => {
    try {
        const employerId = req.params.id;

        const [rows] = await pool.query(
            `
      SELECT 
        a.id,
        a.internship_id,
        a.internship_title,
        a.status,
        a.applied_at,
        u.email AS studentEmail
      FROM applications a
      JOIN internships i ON a.internship_id = i.id
      JOIN users u ON a.student_id = u.id
      WHERE i.employer_id = ?
      ORDER BY a.applied_at DESC
      `,
            [employerId]
        );

        res.json({ status: "ok", applications: rows });
    } catch (err) {
        console.error("APPLICATIONS EMPLOYER ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// =======================
// GET /api/applications/all   (for admin)
// =======================
router.get("/all", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `
      SELECT 
        a.id,
        a.internship_id,
        a.internship_title,
        a.status,
        a.applied_at,
        u.email AS studentEmail
      FROM applications a
      JOIN users u ON a.student_id = u.id
      ORDER BY a.applied_at DESC
      `
        );

        res.json({ status: "ok", applications: rows });
    } catch (err) {
        console.error("APPLICATIONS ALL ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// =======================
// PATCH /api/applications/:id/status
// Accept / Reject an application
// =======================
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

module.exports = router;
