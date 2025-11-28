import express from "express";
import pool from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/apply", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { internshipId, internshipTitle } = req.body;

        await pool.query(
            "INSERT INTO applications (student_id, internship_id, internship_title, status) VALUES (?, ?, ?, ?)",
            [userId, internshipId, internshipTitle, "pending"]
        );

        res.json({
            status: "ok",
            message: "Application submitted successfully"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

export default router;
