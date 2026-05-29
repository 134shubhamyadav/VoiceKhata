const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      match: [/^\+?[0-9]{10,15}$/, 'Enter a valid phone number'],
      default: null,
    },
    email: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
      lowercase: true,
      default: null,
    },
    firebaseUid: {
      type: String,
      required: [true, 'Firebase UID is required'],
      unique: true,
      trim: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    upiId: {
      type: String,
      trim: true,
      default: null,
    },
    shopName: {
      type: String,
      trim: true,
      default: null,
    },
    businessType: {
      type: String,
      trim: true,
      default: null,
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'ta', 'mr', 'gu', 'bho'],
      default: 'en', // default language
    },
    onboardingIncomplete: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
