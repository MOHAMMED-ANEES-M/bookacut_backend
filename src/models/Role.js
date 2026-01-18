const mongoose = require('mongoose');

/**
 * Role Model
 * Defines roles and their permissions for RBAC
 */
const roleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Role name is required'],
      enum: ['platform_super_admin', 'client_admin', 'staff', 'customer'],
    },
    permissions: [
      {
        type: String,
        enum: [
          'manage_shops',
          'manage_staff',
          'manage_services',
          'view_dashboard',
          'manage_slots',
          'view_invoices',
          'manage_settings',
          'view_bookings',
          'create_walkin',
          'edit_price',
          'mark_arrived',
          'mark_no_show',
          'complete_service',
          'generate_invoice',
          'view_services',
          'view_slots',
          'book_slot',
          'view_booking_history',
          'cancel_booking',
        ],
      },
    ],
    isSystemRole: {
      type: Boolean,
      default: false,
    },
    description: {
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

// Index for tenant and role name
roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);

