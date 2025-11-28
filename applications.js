const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// Apply for internship
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

module.exports = router;
