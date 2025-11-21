import dotenv from "dotenv";
dotenv.config(); // 🔑 make sure .env loads before using process.env

import jwt from "jsonwebtoken";
import User from "../models/User.js";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined.");
}

// Generate JWT Token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Authentication Middleware
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      req.user = user;
      req.userId = user._id;
      next();
    } catch (ex) {
      res.status(400).json({ error: "Invalid token." });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ error: "Server error in auth middleware" });
  }
};
