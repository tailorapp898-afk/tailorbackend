// Backend: models/Customer.js (ES6 Module version)
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
   userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
customerSchema.index({ name: 1, phone: 1 });

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;