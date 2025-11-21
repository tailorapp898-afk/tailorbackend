import dotenv from "dotenv";
dotenv.config();


import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Import routes (use import instead of require)
import syncRoutes from "./routes/sync.js";
import authRoutes from "./routes/authRoutes.js";


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tailorbook")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// Routes
app.use("/api/sync", syncRoutes);
// 🧩 Routes
app.use("/api/auth", authRoutes)

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    },
  });
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
