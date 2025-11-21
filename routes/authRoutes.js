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

// 🔹 Register Route (Online Only)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, shop_name } = req.body;

    // 1. Check agar user pehle se exist karta hai (Unique Email Check)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // 2. Password Hash karein (Security)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Naya User create karein
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      shop_name,
    });

    await newUser.save();

    // 4. JWT Token Generate karein
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // 5. Response bhejein (Password wapas nahi bhejna chahiye)
    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        shop_name: newUser.shop_name,
      },
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

export default router
