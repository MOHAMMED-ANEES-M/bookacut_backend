const mongoose = require('mongoose');

/**
 * Slot Model
 * Time slots for bookings, dynamically generated based on shop settings
 */
const slotSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: [true, 'Slot date is required'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Slot capacity is required'],
      default: 1,
      min: 0,
    },
    maxCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['available', 'blocked', 'full'],
      default: 'available',
      index: true,
    },
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    blockedReason: {
      type: String,
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

// Compound indexes for efficient queries
slotSchema.index({ tenantId: 1, shopId: 1, date: 1 });
slotSchema.index({ tenantId: 1, shopId: 1, date: 1, status: 1 });
slotSchema.index({ tenantId: 1, shopId: 1, date: 1, startTime: 1 }, { unique: true });

// Method to check if slot is available
slotSchema.methods.isAvailable = function () {
  return this.status === 'available' && this.bookedCount < this.capacity;
};

// Method to update booked count
slotSchema.methods.updateBookedCount = async function () {
  this.bookedCount = await mongoose.model('Booking').countDocuments({
    slotId: this._id,
    status: { $in: ['confirmed', 'arrived', 'in_progress'] },
  });

  if (this.bookedCount >= this.capacity) {
    this.status = 'full';
  } else if (this.status === 'full' && this.bookedCount < this.capacity) {
    this.status = 'available';
  }

  await this.save();
};

module.exports = mongoose.model('Slot', slotSchema);

