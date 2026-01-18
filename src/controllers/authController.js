const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');
const { AuthenticationError, ValidationError, NotFoundError } = require('../utils/errors');
const { ROLES, PERMISSIONS } = require('../config/constants');

/**
 * Auth Controller
 * Handles authentication and authorization
 */
class AuthController {
  /**
   * Generate JWT Token
   */
  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });
  }

  /**
   * Login
   */
  async login(req, res, next) {
    try {
      const { email, password, tenantId } = req.body;

      if (!email || !password) {
        throw new ValidationError('Email and password are required');
      }

      // Find user
      const user = await User.findOne({ email }).select('+password');

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AuthenticationError('Account is inactive');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid credentials');
      }

      // For non-platform admin, verify tenant
      if (user.role !== ROLES.PLATFORM_SUPER_ADMIN) {
        if (!user.tenantId) {
          throw new AuthenticationError('User not associated with any tenant');
        }

        const tenant = await Tenant.findById(user.tenantId);
        if (!tenant || !tenant.isActive) {
          throw new AuthenticationError('Tenant account is inactive');
        }

        // If tenantId provided in request, verify it matches
        if (tenantId && tenantId.toString() !== user.tenantId.toString()) {
          throw new AuthenticationError('Tenant mismatch');
        }
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(user._id);

      // Get role permissions
      let role = null;
      if (user.roleId) {
        role = await Role.findById(user.roleId);
      } else {
        role = await Role.findOne({
          tenantId: user.tenantId,
          name: user.role,
        });
      }

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          permissions: role?.permissions || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * Register Customer (Online)
   */
  async registerCustomer(req, res, next) {
    try {
      const { email, password, phone, firstName, lastName, tenantId } = req.body;

      if (!email || !password || !phone || !firstName || !lastName || !tenantId) {
        throw new ValidationError('All fields are required');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email, tenantId });

      if (existingUser) {
        throw new ValidationError('User already exists');
      }

      // Verify tenant exists
      const tenant = await Tenant.findById(tenantId);

      if (!tenant || !tenant.isActive) {
        throw new NotFoundError('Tenant');
      }

      // Get customer role
      let role = await Role.findOne({
        tenantId,
        name: ROLES.CUSTOMER,
      });

      // Create customer role if doesn't exist
      if (!role) {
        role = await Role.create({
          tenantId,
          name: ROLES.CUSTOMER,
          permissions: [
            PERMISSIONS.VIEW_SERVICES,
            PERMISSIONS.VIEW_SLOTS,
            PERMISSIONS.BOOK_SLOT,
            PERMISSIONS.VIEW_BOOKING_HISTORY,
            PERMISSIONS.CANCEL_BOOKING,
          ],
          isSystemRole: true,
        });
      }

      // Create user
      const user = await User.create({
        tenantId,
        email,
        password,
        phone,
        firstName,
        lastName,
        role: ROLES.CUSTOMER,
        roleId: role._id,
        bookingType: 'online',
        isActive: true,
      });

      // Generate token
      const token = this.generateToken(user._id);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current User
   */
  async getCurrentUser(req, res, next) {
    try {
      const user = await User.findById(req.user._id)
        .populate('roleId')
        .select('-password');

      if (!user) {
        throw new NotFoundError('User');
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

