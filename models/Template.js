import mongoose from "mongoose"

const templateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ["shirt", "trouser", "suit", "kameez", "sherwani", "other"] },
  measurements: [
    {
      field: String,
      label_en: String,
      label_ur: String,
      unit: { type: String, default: "inches" },
    },
  ],
  isDefault: { type: Boolean, default: false },
    // 🆕 Added for offline-sync or local database mapping
  localId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model("Template", templateSchema)
