const Tenant = require('../models/Tenant');
const { NotFoundError, AuthorizationError } = require('../utils/errors');

/**
 * Tenant Validation Middleware
 * Ensures tenant exists and is active
 * Must be used after authenticate middleware
 */
const validateTenant = async (req, res, next) => {
  try {
    // Platform super admin doesn't need tenant validation
    if (req.user && req.user.role === 'platform_super_admin') {
      // Allow super admin to access without tenant validation
      return next();
    }

    // Tenant ID must be present
    const tenantId = req.tenantId || req.body.tenantId || req.params.tenantId || req.query.tenantId;

    if (!tenantId) {
      throw new AuthorizationError('Tenant ID is required');
    }

    // Verify tenant exists and is active
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    if (!tenant.isActive) {
      throw new AuthorizationError('Tenant account is inactive');
    }

    // Attach tenant to request
    req.tenant = tenant;
    req.tenantId = tenantId;

    // Ensure user's tenantId matches
    if (req.user && req.user.tenantId && req.user.tenantId.toString() !== tenantId.toString()) {
      throw new AuthorizationError('Access denied: Tenant mismatch');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Extract Tenant ID from Request
 * Helper middleware to extract tenantId from various sources
 */
const extractTenantId = (req, res, next) => {
  // Priority: params > body > query > user
  req.tenantId =
    req.params.tenantId || req.body.tenantId || req.query.tenantId || req.user?.tenantId;

  if (!req.tenantId && req.user?.role !== 'platform_super_admin') {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  next();
};

module.exports = {
  validateTenant,
  extractTenantId,
};

