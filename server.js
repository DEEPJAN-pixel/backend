import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import db from "./db.js";

// Load .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// SERVE FRONTEND
app.use(express.static(path.join(__dirname, "../frontend")));

// =======================
// DB TEST
// =======================
app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT 1 AS ok");
        res.json({ status: "success", db: rows[0] });
    } catch (err) {
        console.error(err);
        res.json({ status: "error", message: err.message });
    }
});

// ROUTES
import authRoutes from "./routes/auth.js";
import internshipRoutes from "./routes/internships.js";
import applicationsRoutes from "./routes/applications.js";
import studentRoutes from "./routes/student.js";
import adminRoutes from "./routes/admin.js";
import subscriptionRoutes from "./routes/subscription.js";

app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/subscription", subscriptionRoutes);

// FALLBACK — SEND INDEX.HTML FOR ANY UNKNOWN ROUTE
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// START SERVER
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`VIMP backend+frontend running on port ${PORT}`);
});
