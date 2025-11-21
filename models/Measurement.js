import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // 👇 FIX: required: true hata diya. Sync mein aksar ye fail karwata hai.
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" }, 
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
  
  values: mongoose.Schema.Types.Mixed,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  localId: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Measurement", measurementSchema);