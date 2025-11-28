const express = require("express");
const router = express.Router();
const db = require("../db");

// ========================
// GET EMPLOYER SUBSCRIPTION
// ========================
router.get("/:empId", async (req, res) => {
    try {
        const empId = req.params.empId;

        const [rows] = await db.query(
            "SELECT plan FROM employer_subscriptions WHERE employer_id = ?",
            [empId]
        );

        if (rows.length === 0) {
            return res.json({ status: "ok", plan: "free" });
        }

        res.json({ status: "ok", plan: rows[0].plan });
    } catch (err) {
        console.error("SUB GET ERR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// ========================
// UPGRADE (FREE → PLUS)
// ========================
router.post("/upgrade", async (req, res) => {
    try {
        const { employer_id } = req.body;

        await db.query(
            "UPDATE employer_subscriptions SET plan = 'plus', started_at = NOW() WHERE employer_id = ?",
            [employer_id]
        );

        res.json({ status: "ok", message: "Upgraded to PLUS" });
    } catch (err) {
        console.error("SUB UPDATE ERR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

module.exports = router;
