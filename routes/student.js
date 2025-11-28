const express = require("express");
const router = express.Router();
const pool = require("../db");

// ================================
// 1) STUDENT DASHBOARD KPI
// ================================
router.get("/dashboard/:id", async (req, res) => {
    try {
        const studentId = req.params.id;

        // ---- Applications KPI ----
        const [apps] = await pool.query(
            "SELECT status, COUNT(*) as cnt FROM applications WHERE student_id = ? GROUP BY status",
            [studentId]
        );

        let appsTotal = 0,
            appsAccepted = 0,
            appsPending = 0,
            appsRejected = 0;

        apps.forEach(r => {
            appsTotal += r.cnt;
            const s = (r.status || "").toLowerCase();
            if (s === "accepted") appsAccepted += r.cnt;
            else if (s === "pending") appsPending += r.cnt;
            else if (s === "rejected") appsRejected += r.cnt;
        });

        // ---- Tasks KPI ----
        const [tasks] = await pool.query(
            "SELECT status, COUNT(*) AS cnt FROM tasks WHERE student_id = ? GROUP BY status",
            [studentId]
        );

        let taskTotal = 0,
            taskCompleted = 0;

        tasks.forEach(t => {
            taskTotal += t.cnt;
            const s = (t.status || "").toLowerCase();
            if (s === "done" || s === "submitted") taskCompleted += t.cnt;
        });

        const taskPending = Math.max(taskTotal - taskCompleted, 0);
        const taskPercent = taskTotal === 0
            ? 0
            : Math.round((taskCompleted / taskTotal) * 100);

        // ---- Certificates KPI ----
        const [certRows] = await pool.query(
            "SELECT COUNT(*) AS cnt FROM certificates WHERE student_id = ?",
            [studentId]
        );
        const certCount = certRows[0]?.cnt || 0;

        res.json({
            status: "ok",
            apps: {
                total: appsTotal,
                accepted: appsAccepted,
                pending: appsPending,
                rejected: appsRejected,
            },
            tasks: {
                total: taskTotal,
                completed: taskCompleted,
                pending: taskPending,
                percent: taskPercent,
            },
            certificates: {
                total: certCount,
            },
        });
    } catch (err) {
        console.error("STUDENT DASHBOARD ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// ================================
// 2) STUDENT TASKS LIST
// ================================
router.get("/tasks/:id", async (req, res) => {
    try {
        const studentId = req.params.id;
        const [rows] = await pool.query(
            `SELECT 
          t.id,
          t.title,
          t.description,
          t.due_date,
          t.status
       FROM tasks t
       WHERE t.student_id = ?
       ORDER BY t.due_date IS NULL, t.due_date`,
            [studentId]
        );

        res.json({ status: "ok", tasks: rows });
    } catch (err) {
        console.error("STUDENT TASKS ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// mark single task as Done
router.post("/tasks/:taskId/complete", async (req, res) => {
    try {
        const taskId = req.params.taskId;
        await pool.query(
            "UPDATE tasks SET status = 'Done' WHERE id = ?",
            [taskId]
        );
        res.json({ status: "ok" });
    } catch (err) {
        console.error("TASK COMPLETE ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// ================================
// 3) STUDENT PROFILE
// ================================
router.get("/profile/:id", async (req, res) => {
    try {
        const studentId = req.params.id;
        const [rows] = await pool.query(
            "SELECT id, name, email, address, bio, photo FROM users WHERE id = ? AND role = 'student'",
            [studentId]
        );

        if (!rows.length) {
            return res.status(404).json({ status: "error", message: "Student not found" });
        }

        res.json({ status: "ok", profile: rows[0] });
    } catch (err) {
        console.error("PROFILE LOAD ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

router.patch("/profile/:id", async (req, res) => {
    try {
        const studentId = req.params.id;
        const { name, address, bio } = req.body;

        await pool.query(
            "UPDATE users SET name = ?, address = ?, bio = ? WHERE id = ? AND role = 'student'",
            [name || "", address || "", bio || "", studentId]
        );

        res.json({ status: "ok" });
    } catch (err) {
        console.error("PROFILE UPDATE ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// photo upload / remove
router.patch("/profile/:id/photo", async (req, res) => {
    try {
        const studentId = req.params.id;
        const { photo } = req.body; // base64 or empty string
        await pool.query(
            "UPDATE users SET photo = ? WHERE id = ? AND role = 'student'",
            [photo || "", studentId]
        );
        res.json({ status: "ok" });
    } catch (err) {
        console.error("PROFILE PHOTO ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

router.delete("/profile/:id/photo", async (req, res) => {
    try {
        const studentId = req.params.id;
        await pool.query(
            "UPDATE users SET photo = '' WHERE id = ? AND role = 'student'",
            [studentId]
        );
        res.json({ status: "ok" });
    } catch (err) {
        console.error("PROFILE PHOTO DELETE ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// ================================
// 4) STUDENT NOTIFICATIONS
// ================================
router.get("/notifications/:id", async (req, res) => {
    try {
        const studentId = req.params.id;
        const [rows] = await pool.query(
            "SELECT id, type, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC",
            [studentId]
        );
        res.json({ status: "ok", notifications: rows });
    } catch (err) {
        console.error("NOTIFICATIONS LOAD ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

router.post("/notifications/:id/read", async (req, res) => {
    try {
        const notifId = req.params.id;
        await pool.query(
            "UPDATE notifications SET is_read = 1 WHERE id = ?",
            [notifId]
        );
        res.json({ status: "ok" });
    } catch (err) {
        console.error("NOTIFICATION READ ERROR:", err);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

module.exports = router;
