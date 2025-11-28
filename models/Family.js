// Backend: models/Family.js (ES6 Module version)
import mongoose from 'mongoose';

const familySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
   userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
}, {
  timestamps: true
});

const Family = mongoose.model('Family', familySchema);

export default Family;