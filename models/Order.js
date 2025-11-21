import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  // Yahan se userId hata diya, kyunki ye poore Order ka hota hai, har item ka nahi
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1, min: 1 },
  rate: { type: Number, required: true, default: 0, min: 0 },
  amount: { type: Number, required: true, default: 0 },
  deliveryDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['pending', 'cutting', 'stitching', 'finishing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  }
});

const orderSchema = new mongoose.Schema({
  // 👇 YE HAI FIX: userId ko yahan sabse upar add kiya hai
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    // required: true ko hata diya taake sync fail na ho agar customer ID temporary ho
  },
  items: [orderItemSchema],
  notes: { type: String, default: '' },
  totalAmount: { type: Number, required: true, default: 0 },
  advancePayment: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'in-progress', 'ready', 'delivered', 'cancelled'],
    default: 'draft'
  },
  deliveryDate: { type: Date, default: null },
  localId: { type: String, default: null }, // Sync ke liye zaroori
}, {
  timestamps: true
});

// Virtuals setup
orderSchema.virtual('remainingBalance').get(function () {
  return this.totalAmount - this.advancePayment;
});
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;