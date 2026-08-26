const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const jobsRoutes = require("./routes/jobsRoutes");
const applicationsRoutes = require("./routes/applicationsRoutes");
const authenticateToken = require("./middleware/authMiddleware");
const requireAdmin = require("./middleware/adminMiddleware");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const allowedOrigins = new Set([
    "http://localhost:5500",
    "http://localhost:5501",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501",
    ...(process.env.FRONTEND_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean),
]);

app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS."));
    },
}));
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/protected", authenticateToken, (req, res) => {
    res.json({
        message: "You have access to the protected route!",
        user: req.user
    });
});

app.get("/", (req, res) => {
    res.json({
        message: "Northstar Career Portal API is running!"
    });
});
app.get(
    "/api/admin/test",
    authenticateToken,
    requireAdmin,
    (req, res) => {
        res.json({
            message: "Admin access confirmed!",
            user: req.user
        });
    }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    try {
        const connection = await db.getConnection();

        console.log("MySQL database connected successfully!");

        connection.release();
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
    }
});