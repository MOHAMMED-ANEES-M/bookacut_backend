const mongoose = require('mongoose');

/**
 * Booking Model
 * Represents customer bookings (online or walk-in)
 */
const bookingSchema = new mongoose.Schema(
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
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: [true, 'Slot ID is required'],
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required'],
      index: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service ID is required'],
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffProfile',
    },
    bookingType: {
      type: String,
      enum: ['online', 'walkin'],
      required: true,
      default: 'online',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'arrived', 'in_progress', 'completed', 'no_show', 'rejected', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    finalPrice: {
      type: Number,
      required: true,
    },
    priceEdited: {
      type: Boolean,
      default: false,
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    editReason: {
      type: String,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    arrivedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    finishedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
    },
    notes: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['normal', 'high'],
      default: 'normal',
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
bookingSchema.index({ tenantId: 1, shopId: 1, status: 1 });
bookingSchema.index({ tenantId: 1, shopId: 1, scheduledAt: 1 });
bookingSchema.index({ tenantId: 1, customerId: 1 });
bookingSchema.index({ slotId: 1, status: 1 });
bookingSchema.index({ tenantId: 1, shopId: 1, bookingType: 1 });

// Update slot booked count when booking status changes
bookingSchema.post('save', async function () {
  const Slot = mongoose.model('Slot');
  const slot = await Slot.findById(this.slotId);
  if (slot) {
    await slot.updateBookedCount();
  }
});

module.exports = mongoose.model('Booking', bookingSchema);

