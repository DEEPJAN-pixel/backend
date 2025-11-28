const express = require("express");
const router = express.Router();
const pool = require("../db");

// simple: list all users grouped by role
router.get("/users", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, name, email, role, created_at FROM users ORDER BY role, created_at DESC"
        );
        res.json({ status: "ok", users: rows });
    } catch (err) {
        console.error("ADMIN USERS ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

module.exports = router;
