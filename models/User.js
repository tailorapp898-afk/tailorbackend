import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // 👇 YEH LINE ADD KAREIN (Role based access ke liye)
  role: { type: String, enum: ["user", "admin"], default: "user" },
  
  phone: String,
  shop_name: String,
  shop_address: String,
  language: { type: String, default: "en", enum: ["en", "ur"] },
  theme: { type: String, default: "light", enum: ["light", "dark"] },
  localId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);