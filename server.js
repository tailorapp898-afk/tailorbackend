import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

// Import routes
import syncRoutes from "./routes/sync.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/api/sync", syncRoutes);
app.use("/api/auth", authRoutes);

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

// ✅ FIX: Database Connection Function
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tailorbook", {
      // Ye options timeout issues debug karne mein help karenge
      serverSelectionTimeoutMS: 5000, // 5 second mein fail ho jaye agar connect na ho
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // Agar DB connect nahi hua to server band kar do
  }
};

// ✅ FIX: Server Start Logic
// Server tab hi start hoga jab DB connect ho jayega
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
