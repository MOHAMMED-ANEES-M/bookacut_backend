const mongoose = require('mongoose');

/**
 * OTP Model
 * Stores OTP codes for email verification during registration
 */
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, 'OTP code is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['client_admin_registration', 'password_reset'],
      default: 'client_admin_registration',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired OTPs
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding valid OTPs
otpSchema.index({ email: 1, code: 1, isUsed: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', otpSchema);

