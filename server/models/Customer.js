const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      match: [/^\+?[0-9]{10,15}$/, 'Enter a valid phone number'],
    },
    // Running balance of how much this customer owes (in paise to avoid float issues)
    totalOwed: {
      type: Number,
      default: 0,
      min: 0,
    },
    // String risk level: 'low', 'medium', or 'high'
    riskScore: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index: one user can't have duplicate phone numbers for customers
customerSchema.index({ userId: 1, phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Customer', customerSchema);
