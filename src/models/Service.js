const mongoose = require('mongoose');

/**
 * Service Model
 * Services offered by shops (e.g., Haircut, Facial, etc.)
 */
const serviceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      // index: true, // Removed redundant index
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      // index: true, // Removed redundant index
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: [true, 'Service category is required'],
      // index: true, // Removed redundant index
    },
    duration: {
      type: Number,
      required: [true, 'Service duration is required'],
      default: 30, // minutes
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: 0,
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

// Compound indexes
serviceSchema.index({ tenantId: 1, shopId: 1 });
serviceSchema.index({ tenantId: 1, shopId: 1, isActive: 1 });
serviceSchema.index({ tenantId: 1, shopId: 1, categoryId: 1 });

module.exports = mongoose.model('Service', serviceSchema);

