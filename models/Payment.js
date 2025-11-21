import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["cash", "bank_transfer", "card", "cheque"], default: "cash" },
  type: { type: String, enum: ["advance", "partial", "full", "extra"], default: "partial" },
  reference: String,
  notes: String,
    // 🆕 Added for offline-sync or local database mapping
  localId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model("Payment", paymentSchema)

