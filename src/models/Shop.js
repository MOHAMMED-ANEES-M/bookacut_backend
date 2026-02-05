const mongoose = require('mongoose');

/**
 * Shop Model
 * Each shop belongs to a tenant and has independent operations
 */
const shopSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      // index: true, // Removed redundant index
    },
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    workingHours: {
      monday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
      tuesday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
      wednesday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
      thursday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
      friday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
      saturday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
      sunday: { start: String, end: String, isOpen: { type: Boolean, default: false } },
    },
    slotDuration: {
      type: Number,
      default: 30, // minutes
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Compound index for tenant and shop queries
shopSchema.index({ tenantId: 1, isActive: 1 });
shopSchema.index({ tenantId: 1, name: 1 });

module.exports = mongoose.model('Shop', shopSchema);

