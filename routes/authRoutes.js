import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import bcrypt from "bcryptjs"

const router = express.Router()

router.post("/login", async (req, res) => {
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // ✅ FIX 1: Key ka naam 'id' karein (Register jaisa same)
    // ✅ FIX 2: Expiry time bhi same (30d) rakhein taaki consistency rahe
    const token = jwt.sign(
      { id: user._id }, // Pehle 'userId' tha, ab 'id' hai
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id, // Consistency ke liye '_id' use karein
        name: user.name,
        email: user.email,
        shop_name: user.shop_name,
        shop_address: user.shop_address,
        role: user.role, // Role bhi bhejein
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.post("/logout", (req, res) => {
  try {
    // no token invalidation needed (non-expiring token)
    res.json({ message: "Logout successful" })
  } catch (err) {
    res.status(500).json({ error: "Logout failed" })
  }
})
export default router
