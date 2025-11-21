import mongoose from "mongoose"

const invoiceSchema = new mongoose.Schema({
   userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  invoiceNumber: { type: String, unique: true },
  items: mongoose.Schema.Types.Mixed,
  subtotal: Number,
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: Number,
  paid: { type: Number, default: 0 },
  remaining: Number,
  status: { type: String, enum: ["draft", "sent", "paid", "overdue"], default: "draft" },
  dueDate: Date,
  notes: String,
    // 🆕 Added for offline-sync or local database mapping
  localId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model("Invoice", invoiceSchema)
