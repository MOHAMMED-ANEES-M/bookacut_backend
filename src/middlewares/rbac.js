const Role = require('../models/Role');
const { AuthorizationError } = require('../utils/errors');
const { ROLES, PERMISSIONS } = require('../config/constants');

/**
 * Role-Based Access Control Middleware
 * Checks if user has required permission(s)
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Platform super admin has all permissions
      if (req.user && req.user.role === ROLES.PLATFORM_SUPER_ADMIN) {
        return next();
      }

      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      // Get user's role and permissions
      let role = null;
      if (req.user.roleId) {
        role = await Role.findById(req.user.roleId);
      } else {
        // Fallback: find role by name and tenant
        role = await Role.findOne({
          tenantId: req.user.tenantId,
          name: req.user.role,
        });
      }

      if (!role) {
        throw new AuthorizationError('Role not found');
      }

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some((permission) =>
        role.permissions.includes(permission)
      );

      if (!hasPermission) {
        throw new AuthorizationError(
          `Access denied: Required permission(s): ${requiredPermissions.join(', ')}`
        );
      }

      req.userRole = role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require Specific Role Middleware
 */
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthorizationError('Authentication required');
      }

      // Platform super admin can access everything
      if (req.user.role === ROLES.PLATFORM_SUPER_ADMIN) {
        return next();
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AuthorizationError(`Access denied: Required role(s): ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Shop Access Validation
 * Ensures user has access to the shop (for multi-shop scenarios)
 */
const validateShopAccess = async (req, res, next) => {
  try {
    const shopId = req.params.shopId || req.body.shopId || req.query.shopId;

    if (!shopId) {
      return next(); // Some endpoints don't require shopId
    }

    // Platform super admin has access to all shops
    if (req.user && req.user.role === ROLES.PLATFORM_SUPER_ADMIN) {
      return next();
    }

    // Client admin has access to all shops in their tenant
    if (req.user && req.user.role === ROLES.CLIENT_ADMIN) {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({
        _id: shopId,
        tenantId: req.tenantId,
      });

      if (!shop) {
        throw new AuthorizationError('Shop not found or access denied');
      }

      req.shop = shop;
      return next();
    }

    // Staff can only access their assigned shop
    if (req.user && req.user.role === ROLES.STAFF) {
      const StaffProfile = require('../models/StaffProfile');
      const staffProfile = await StaffProfile.findOne({
        userId: req.user._id,
        shopId: shopId,
        tenantId: req.tenantId,
        isActive: true,
      });

      if (!staffProfile) {
        throw new AuthorizationError('Access denied: Not assigned to this shop');
      }

      req.shopId = shopId;
      return next();
    }

    // Customers can access shops for booking
    if (req.user && req.user.role === ROLES.CUSTOMER) {
      const Shop = require('../models/Shop');
      const shop = await Shop.findOne({
        _id: shopId,
        tenantId: req.tenantId,
        isActive: true,
      });

      if (!shop) {
        throw new AuthorizationError('Shop not found or inactive');
      }

      req.shop = shop;
      return next();
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requirePermission,
  requireRole,
  validateShopAccess,
};

