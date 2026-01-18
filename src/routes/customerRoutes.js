const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { validateTenant, extractTenantId } = require('../middlewares/tenant');
const { requireRole } = require('../middlewares/rbac');
const { ROLES } = require('../config/constants');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validator');

/**
 * Customer Routes
 * Some routes are public (optional auth), booking routes require authentication
 */

// Public routes (optional auth for tenant context)
router.use(optionalAuth);
router.use(extractTenantId);

// Get Shop Details (Public)
router.get('/shops/:shopId', customerController.getShopDetails.bind(customerController));

// Get Shop Services (Public)
router.get('/shops/:shopId/services', customerController.getShopServices.bind(customerController));

// Get Available Slots (Public)
router.get('/shops/:shopId/slots', customerController.getAvailableSlots.bind(customerController));

// Authenticated routes for booking
router.use(authenticate);
router.use(validateTenant);
router.use(requireRole(ROLES.CUSTOMER));

// Book Slot
router.post(
  '/shops/:shopId/bookings',
  [
    body('slotId').notEmpty(),
    body('serviceId').notEmpty(),
    validate,
  ],
  customerController.bookSlot.bind(customerController)
);

// Get Booking History
router.get('/bookings', customerController.getBookingHistory.bind(customerController));

// Cancel Booking
router.post(
  '/shops/:shopId/bookings/:bookingId/cancel',
  customerController.cancelBooking.bind(customerController)
);

module.exports = router;

