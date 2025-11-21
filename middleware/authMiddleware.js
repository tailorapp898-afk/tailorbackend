import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // 1. Check Header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("❌ Auth Failed: No Header or invalid format");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🔥 DEBUGGING LOGS (Ye check karein console mein)
    console.log("✅ Token Decoded:", decoded); 

    // 3. ID Check (Sabse bara masla yahan hota hai)
    // Agar token mein 'id' hai to 'id' lo, agar 'userId' hai to wo lo
    const idToSearch = decoded.userId || decoded.id || decoded._id;
    
    if (!idToSearch) {
      console.log("❌ Auth Failed: Token payload mein ID nahi mili");
      return res.status(401).json({ error: "Invalid Token Payload" });
    }

    const user = await User.findById(idToSearch);
    
    if (!user) {
      console.log(`❌ Auth Failed: Database mein user nahi mila (ID: ${idToSearch})`);
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
    
  } catch (err) {
    // 4. Specific Error Printing
    console.log("❌ JWT Error:", err.message); // Expired? Malformed?
    
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};