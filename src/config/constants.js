/**
 * Application Constants
 * Centralized constants for the application
 */

module.exports = {
  // User Roles
  ROLES: {
    PLATFORM_SUPER_ADMIN: 'platform_super_admin',
    CLIENT_ADMIN: 'client_admin',
    STAFF: 'staff',
    CUSTOMER: 'customer',
  },

  // Booking Status
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ARRIVED: 'arrived',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    NO_SHOW: 'no_show',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
  },

  // Booking Types
  BOOKING_TYPE: {
    ONLINE: 'online',
    WALKIN: 'walkin',
  },

  // Invoice Status
  INVOICE_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    CANCELLED: 'cancelled',
  },

  // Slot Status
  SLOT_STATUS: {
    AVAILABLE: 'available',
    BLOCKED: 'blocked',
    FULL: 'full',
  },

  // Default Values
  DEFAULT_SLOT_DURATION: parseInt(process.env.DEFAULT_SLOT_DURATION_MINUTES) || 30,
  BOOKING_ADVANCE_DAYS: parseInt(process.env.BOOKING_ADVANCE_DAYS) || 7,
  NO_SHOW_TIMEOUT_MINUTES: parseInt(process.env.NO_SHOW_TIMEOUT_MINUTES) || 5,

  // Working Hours Default
  DEFAULT_WORKING_HOURS: {
    START: process.env.DEFAULT_WORKING_HOURS_START || '09:00',
    END: process.env.DEFAULT_WORKING_HOURS_END || '18:00',
  },

  // Permissions
  PERMISSIONS: {
    // Client Admin Permissions
    MANAGE_SHOPS: 'manage_shops',
    MANAGE_STAFF: 'manage_staff',
    MANAGE_SERVICES: 'manage_services',
    VIEW_DASHBOARD: 'view_dashboard',
    MANAGE_SLOTS: 'manage_slots',
    VIEW_INVOICES: 'view_invoices',
    MANAGE_SETTINGS: 'manage_settings',

    // Staff Permissions
    VIEW_BOOKINGS: 'view_bookings',
    CREATE_WALKIN: 'create_walkin',
    EDIT_PRICE: 'edit_price',
    MARK_ARRIVED: 'mark_arrived',
    MARK_NO_SHOW: 'mark_no_show',
    COMPLETE_SERVICE: 'complete_service',
    GENERATE_INVOICE: 'generate_invoice',

    // Customer Permissions
    VIEW_SERVICES: 'view_services',
    VIEW_SLOTS: 'view_slots',
    BOOK_SLOT: 'book_slot',
    VIEW_BOOKING_HISTORY: 'view_booking_history',
    CANCEL_BOOKING: 'cancel_booking',
  },
};

