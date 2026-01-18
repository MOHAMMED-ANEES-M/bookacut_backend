const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticate } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/rbac');
const { ROLES } = require('../config/constants');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validator');

/**
 * Super Admin Routes
 * All routes require platform_super_admin role
 */

// Apply authentication and role check to all routes
router.use(authenticate);
router.use(requireRole(ROLES.PLATFORM_SUPER_ADMIN));

// Dashboard
router.get('/dashboard', superAdminController.getDashboardStats.bind(superAdminController));

// Tenant Management
router.get('/tenants', superAdminController.getAllTenants.bind(superAdminController));

router.get('/tenants/:tenantId', superAdminController.getTenantDetails.bind(superAdminController));

router.post(
  '/tenants',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('phone').notEmpty(),
    body('adminEmail').isEmail().normalizeEmail(),
    body('adminPassword').isLength({ min: 6 }),
    body('adminFirstName').notEmpty().trim(),
    body('adminLastName').notEmpty().trim(),
    validate,
  ],
  superAdminController.createTenant.bind(superAdminController)
);

router.put('/tenants/:tenantId', superAdminController.updateTenant.bind(superAdminController));

// Client Admin User Management
router.post(
  '/tenants/:tenantId/admin',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    validate,
  ],
  superAdminController.createClientAdmin.bind(superAdminController)
);

router.put(
  '/tenants/:tenantId/admin/:userId/password',
  [
    body('password').isLength({ min: 6 }),
    validate,
  ],
  superAdminController.updateClientAdminPassword.bind(superAdminController)
);

// Subscription Management
router.post(
  '/tenants/:tenantId/payments',
  [
    body('amount').isFloat({ min: 0 }),
    body('paymentMethod').isIn(['cash', 'bank_transfer', 'check', 'other']),
    body('subscriptionPeriod').optional().isInt({ min: 1 }),
    validate,
  ],
  superAdminController.recordPayment.bind(superAdminController)
);

router.put(
  '/tenants/:tenantId/subscription',
  [
    body('subscriptionExpiresAt').isISO8601(),
    validate,
  ],
  superAdminController.updateSubscriptionExpiry.bind(superAdminController)
);

router.get(
  '/tenants/:tenantId/payments',
  superAdminController.getPaymentHistory.bind(superAdminController)
);

module.exports = router;

