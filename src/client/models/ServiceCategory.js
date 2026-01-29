const mongoose = require('mongoose');

/**
 * Service Category Model Schema
 * Stored in CLIENT DATABASE
 * Categories for organizing services (e.g., BARBER, SCRUB, MASSAGE, etc.)
 * NO tenantId - database isolation provides tenant separation
 */
const serviceCategorySchema = new mongoose.Schema(
  {
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
serviceCategorySchema.index({ shopId: 1 });
serviceCategorySchema.index({ shopId: 1, isActive: 1 });
serviceCategorySchema.index({ shopId: 1, name: 1 }, { unique: true });

module.exports = {
  schema: serviceCategorySchema,
};

