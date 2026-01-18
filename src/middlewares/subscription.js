const Tenant = require('../models/Tenant');
const { AuthorizationError } = require('../utils/errors');
const moment = require('moment');
const { ROLES } = require('../config/constants');

/**
 * Subscription Validation Middleware
 * Ensures tenant subscription is active before allowing operations
 * Skip for platform super admin
 */
const validateSubscription = async (req, res, next) => {
  try {
    // Platform super admin doesn't need subscription validation
    if (req.user && req.user.role === ROLES.PLATFORM_SUPER_ADMIN) {
      return next();
    }

    // Get tenant ID
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return next(); // Let other middlewares handle tenant validation
    }

    // Get tenant
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return next(); // Let other middlewares handle tenant not found
    }

    // Check if subscription is active
    if (tenant.subscriptionExpiresAt) {
      const isExpired = moment(tenant.subscriptionExpiresAt).isBefore(moment());

      if (isExpired) {
        throw new AuthorizationError(
          'Subscription has expired. Please renew your subscription to continue using the service.'
        );
      }
    } else {
      // No expiry date set - allow access but could be restricted
      // For now, we'll allow it but you can change this behavior
      console.warn(`Tenant ${tenantId} has no subscription expiry date set`);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateSubscription,
};

