const express = require("express");
const router = express.Router();
const pool = require("../db");

// =========================
// POST INTERNSHIP (Create)
// =========================
router.post("/", async (req, res) => {
    try {
        const {
            employer_id,
            title,
            company,
            location,
            description,
            mode,
            type,
            stipend,
            start_date,
            end_date
        } = req.body;

        if (!employer_id || !title || !company || !location || !description) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields."
            });
        }

        await pool.query(
            `INSERT INTO internships 
                (employer_id, title, company, location, description, mode, type, stipend, start_date, end_date) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employer_id,
                title,
                company,
                location,
                description,
                mode || null,
                type || null,
                stipend || null,
                start_date || null,
                end_date || null,
                "open"
            ]
        );

        res.json({ status: "ok", message: "Internship posted" });

    } catch (err) {
        console.error("INTERNSHIP POST ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// =========================
// GET ALL INTERNSHIPS
// =========================
router.get("/all", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM internships ORDER BY id DESC"
        );
        res.json({ status: "ok", internships: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// =========================
// GET INTERNSHIPS OF EMPLOYER
// =========================
router.get("/employer/:id", async (req, res) => {
    try {
        const employerId = req.params.id;

        const [rows] = await pool.query(
            "SELECT * FROM internships WHERE employer_id = ? ORDER BY id DESC",
            [employerId]
        );

        res.json({ status: "ok", internships: rows });
    } catch (e) {
        console.error(e);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

module.exports = router;
