const mongoose = require('mongoose');

/**
 * Subscription Payment Model
 * Tracks subscription payments made by tenants
 * Super admin manually records payments and updates expiry
 */
const subscriptionPaymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'check', 'other'],
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    subscriptionPeriod: {
      type: Number,
      required: true,
      default: 1, // Number of months
      min: 1,
    },
    subscriptionExpiresAt: {
      type: Date,
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // Super admin who recorded the payment
    },
    notes: {
      type: String,
    },
    receiptNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionPaymentSchema.index({ tenantId: 1, paymentDate: -1 });
subscriptionPaymentSchema.index({ recordedBy: 1 });
subscriptionPaymentSchema.index({ receiptNumber: 1 });

module.exports = mongoose.model('SubscriptionPayment', subscriptionPaymentSchema);

