import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js"; // Aapka user model path check kar lena

const router = express.Router();

// ==========================================
// 🛡️ SECURITY MIDDLEWARE (The Gatekeeper)
// ==========================================
// Isay hum har route pe lagayenge taake koi aera-ghera access na kare.
const protectAdmin = async (req, res, next) => {
  try {
    // 1. Check if Authorization header exists
    const token = req.headers.authorization;
    
    // Yahan hum check kar rahe hain ke token hai ya nahi.
    // Real setup mein yahan JWT verify hota hai using: jwt.verify(token, process.env.JWT_SECRET)
    if (!token) {
      return res.status(401).json({ message: "❌ No token provided, authorization denied!" });
    }

    // AGAR AAPKO ABHI TESTING KE LIYE AUTH OFF KARNA HAI to
    // neechay wali 'next()' line ko uncomment karein aur baaki code comment kardein.
    // next(); 

    // Filhal testing ke liye maan letay hain agar header mein token hai to access de do.
    // (Jab frontend ready ho, yahan apna asli verifyUser logic lagana).
    next(); 

  } catch (error) {
    res.status(401).json({ message: "❌ Invalid Token" });
  }
};

// ==========================================
// 🚀 ADMIN ROUTES (CRUD Operations)
// ==========================================

// 1️⃣ GET ALL USERS (Read)
// URL: GET /api/admin/users
router.get("/users", protectAdmin, async (req, res) => {
  try {
    // Sab users lao, lekin password mat bhejo
    const users = await User.find().sort({ createdAt: -1 }).select("-password");
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2️⃣ ADD NEW USER (Create)
// URL: POST /api/admin/users
router.post("/users", protectAdmin, async (req, res) => {
  try {
    const { name, email, password, phone, shop_name, role } = req.body;

    // Check agar user pehle se hai
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "⚠️ User already exists with this email" });
    }

    // Password Hash karo (Security zaroori hai)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Naya user banao
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      shop_name,
      role: role || "user" // Default user, agar admin banana ho to "admin" bhejo
    });

    res.status(201).json({
      success: true,
      message: "✅ New member added successfully!",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        shop_name: user.shop_name
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3️⃣ UPDATE USER (Edit)
// URL: PUT /api/admin/users/:id
router.put("/users/:id", protectAdmin, async (req, res) => {
  try {
    // Password update alag logic se hota hai, isliye usay body se nikal do agar empty hai
    const { password, ...updateData } = req.body;

    // Agar admin ne password bhi change kiya hai to usay hash karo
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true } // new: true ka matlab updated data wapis milega
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "❌ User not found" });
    }

    res.status(200).json({
      success: true,
      message: "🔄 User updated successfully",
      data: user
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4️⃣ DELETE USER (Delete)
// URL: DELETE /api/admin/users/:id
router.delete("/users/:id", protectAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "❌ User not found" });
    }

    res.status(200).json({
      success: true,
      message: "🗑️ User deleted successfully",
      id: req.params.id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;