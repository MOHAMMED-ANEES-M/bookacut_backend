const mongoose = require('mongoose');

/**
 * Service Category Model
 * Categories for organizing services (e.g., BARBER, SCRUB, MASSAGE, etc.)
 */
const serviceCategorySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    description: {
      type: String,
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
serviceCategorySchema.index({ tenantId: 1, shopId: 1 });
serviceCategorySchema.index({ tenantId: 1, shopId: 1, isActive: 1 });
serviceCategorySchema.index({ tenantId: 1, shopId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);

