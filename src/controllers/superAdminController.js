const { getClientAdminModel } = require('../platform/models/ClientAdmin');
const logger = require('../utils/logger');
const { getClientDatabaseMapModel } = require('../platform/models/ClientDatabaseMap');
const connectionManager = require('../database/connectionManager');
const { getModel } = require('../database/modelFactory');
const shopSchema = require('../client/models/Shop').schema;
const clientDatabaseService = require('../services/clientDatabaseService');
const { NotFoundError, ValidationError } = require('../utils/errors');
const moment = require('moment');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * Super Admin Controller
 * Handles platform-level operations
 */
class SuperAdminController {
  /**
   * Get All Client Admins (Tenants) with Shop Counts
   */
  async getAllTenants(req, res, next) {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { search, status } = req.query;

      logger.info(`SuperAdminController.getAllTenants: Fetching all tenants. Search="${search || ''}", Status="${status || 'all'}"`);

      // Build query
      const query = {};
      if (status) {
        query.isActive = status === 'active';
      }
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const ClientAdmin = getClientAdminModel();

      // Get client admins
      const clientAdmins = await ClientAdmin.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Get shop counts and admin details for each client
      const clientsWithShopCounts = await Promise.all(
        clientAdmins.map(async (clientAdmin) => {
          // Get shop count from client database
          let shopCount = 0;
          let totalShops = 0;

          try {
            const clientDb = await connectionManager.getDb(clientAdmin.databaseName);
            const Shop = await getModel(clientAdmin.databaseName, 'Shop', shopSchema);

            shopCount = await Shop.countDocuments({ isActive: true });
            totalShops = await Shop.countDocuments({});
          } catch (error) {
            console.error(`Error getting shop count for ${clientAdmin.databaseName}:`, error.message);
          }

          // Check subscription status
          const isSubscriptionActive =
            clientAdmin.subscriptionExpiresAt && moment(clientAdmin.subscriptionExpiresAt).isAfter(moment());

          const daysUntilExpiry = clientAdmin.subscriptionExpiresAt
            ? moment(clientAdmin.subscriptionExpiresAt).diff(moment(), 'days')
            : null;

          const isExpired = clientAdmin.subscriptionExpiresAt
            ? moment(clientAdmin.subscriptionExpiresAt).isBefore(moment())
            : false;

          const isDemoPeriod = clientAdmin.subscriptionExpiresAt
            ? moment(clientAdmin.subscriptionExpiresAt).diff(moment(clientAdmin.createdAt), 'days') <= 3
            : false;

          return {
            ...clientAdmin.toObject(),
            shopCount,
            totalShops,
            isSubscriptionActive,
            isExpired,
            isDemoPeriod,
            daysUntilExpiry,
            subscriptionStartDate: clientAdmin.createdAt,
            subscriptionExpiryDate: clientAdmin.subscriptionExpiresAt,
          };
        })
      );

      const total = await ClientAdmin.countDocuments(query);

      res.json(formatPaginatedResponse(clientsWithShopCounts, total, { page, limit }, 'tenants'));

      logger.info(`SuperAdminController.getAllTenants: Returned ${clientsWithShopCounts.length} tenants out of total ${total}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Tenant Details with Full Statistics
   */
  async getTenantDetails(req, res, next) {
    try {
      const { tenantId } = req.params;

      const ClientAdmin = await getClientAdminModel();
      const tenant = await ClientAdmin.findById(tenantId);

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      // Get shop counts
      let activeShopCount = 0;
      let totalShopCount = 0;

      try {
        const clientDb = await connectionManager.getDb(tenant.databaseName);
        const Shop = await getModel(tenant.databaseName, 'Shop', shopSchema);

        activeShopCount = await Shop.countDocuments({ isActive: true });
        totalShopCount = await Shop.countDocuments({});
      } catch (error) {
           console.error(`Error getting shop stats for ${tenant.databaseName}:`, error.message);
      }

      // Get payment history (mock or from platform db if we add it later, for now SubscriptionPayment is likely to be undefined if not imported)
      // We need to import SubscriptionPayment model if it exists, or just return empty for now if not fully implemented in platform db
      const SubscriptionPayment = require('../platform/models/SubscriptionPayment'); 

      const payments = await SubscriptionPayment.find({ tenantId: tenant._id })
        .populate('recordedBy', 'firstName lastName email')
        .sort({ paymentDate: -1 })
        .limit(10);

      // Get subscription status
      const isSubscriptionActive =
        tenant.subscriptionExpiresAt && moment(tenant.subscriptionExpiresAt).isAfter(moment());

      const daysUntilExpiry = tenant.subscriptionExpiresAt
        ? moment(tenant.subscriptionExpiresAt).diff(moment(), 'days')
        : null;

      const isExpired = tenant.subscriptionExpiresAt
        ? moment(tenant.subscriptionExpiresAt).isBefore(moment())
        : false;

      const isDemoPeriod = tenant.subscriptionExpiresAt
        ? moment(tenant.subscriptionExpiresAt).diff(moment(tenant.createdAt), 'days') <= 3
        : false;

      // Get all client admin users from Client DB
      let clientAdmins = [];
      try {
          const clientDb = await connectionManager.getDb(tenant.databaseName);
          const userSchema = require('../client/models/User').schema;
          const User = await getModel(tenant.databaseName, 'User', userSchema);
          const { ROLES } = require('../config/constants');
          
          clientAdmins = await User.find({ role: ROLES.CLIENT_ADMIN })
            .select('firstName lastName email phone lastLogin createdAt isActive')
            .sort({ createdAt: -1 });
            
      } catch (error) {
          console.error(`Error fetching client admins for ${tenant.databaseName}:`, error.message);
      }

      res.json({
        success: true,
        tenant: {
          ...tenant.toObject(),
          activeShopCount,
          totalShopCount,
          isSubscriptionActive,
          isExpired,
          isDemoPeriod,
          daysUntilExpiry,
          subscriptionStartDate: tenant.createdAt,
          subscriptionExpiryDate: tenant.subscriptionExpiresAt,
          clientAdmins, // Return list of actual admin users
          recentPayments: payments,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record Subscription Payment and Update Expiry
   */
  async recordPayment(req, res, next) {
    try {
      const { tenantId } = req.params;
      const {
        amount,
        currency = 'USD',
        paymentMethod,
        subscriptionPeriod = 1,
        paymentDate,
        notes,
        receiptNumber,
      } = req.body;

      logger.info(`SuperAdminController.recordPayment: Recording payment of ${amount} ${currency} for tenantId=${tenantId}`);

      if (!amount || !paymentMethod) {
        throw new ValidationError('Amount and payment method are required');
      }

      const ClientAdmin = await getClientAdminModel();
      const tenant = await ClientAdmin.findById(tenantId);

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      // Calculate new expiry date
      const currentExpiry = tenant.subscriptionExpiresAt
        ? moment(tenant.subscriptionExpiresAt)
        : moment();
        
      // If expired, start from now
      const effectiveStartDate = currentExpiry.isBefore(moment()) ? moment() : currentExpiry;
      
      const newExpiry = effectiveStartDate
        .clone()
        .add(subscriptionPeriod, 'months')
        .toDate();

      // Update tenant subscription
      tenant.subscriptionExpiresAt = newExpiry;
      if (req.body.subscriptionPlan) {
          tenant.subscriptionPlan = req.body.subscriptionPlan;
      }
      await tenant.save();

      const SubscriptionPayment = require('../platform/models/SubscriptionPayment');
      
      // Record payment
      const payment = await SubscriptionPayment.create({
        tenantId: tenant._id,
        amount,
        currency,
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        subscriptionPeriod,
        subscriptionExpiresAt: newExpiry,
        recordedBy: req.user._id,
        notes,
        receiptNumber,
      });

      res.status(201).json({
        success: true,
        message: 'Payment recorded and subscription updated',
        payment,
        tenant: {
          ...tenant.toObject(),
          subscriptionExpiresAt: newExpiry,
        },
      });

      logger.info(`SuperAdminController.recordPayment: Successfully recorded payment ID=${payment._id}. New expiry: ${newExpiry}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Subscription Expiry Manually
   */
  async updateSubscriptionExpiry(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { subscriptionExpiresAt, subscriptionPlan, notes } = req.body;

      if (!subscriptionExpiresAt) {
        throw new ValidationError('Subscription expiry date is required');
      }

      const ClientAdmin = await getClientAdminModel();
      const tenant = await ClientAdmin.findById(tenantId);

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      tenant.subscriptionExpiresAt = new Date(subscriptionExpiresAt);
      if (subscriptionPlan) {
        tenant.subscriptionPlan = subscriptionPlan;
      }
      await tenant.save();

      const SubscriptionPayment = require('../platform/models/SubscriptionPayment');

      // Optionally record as manual update
      if (notes) {
        await SubscriptionPayment.create({
          tenantId: tenant._id,
          amount: 0,
          currency: 'USD',
          paymentMethod: 'other',
          paymentDate: new Date(),
          subscriptionPeriod: 0,
          subscriptionExpiresAt: tenant.subscriptionExpiresAt,
          recordedBy: req.user._id,
          notes: `Manual update: ${notes}`,
        });
      }

      res.json({
        success: true,
        message: 'Subscription expiry updated',
        tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Payment History for a Tenant
   */
  async getPaymentHistory(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { page, limit, skip } = getPaginationParams(req.query);

      const SubscriptionPayment = require('../platform/models/SubscriptionPayment');
      const payments = await SubscriptionPayment.find({ tenantId })
        .populate('recordedBy', 'firstName lastName email')
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limit);

      const total = await SubscriptionPayment.countDocuments({ tenantId });

      res.json(formatPaginatedResponse(payments, total, { page, limit }, 'payments'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Dashboard Statistics
   */
  async getDashboardStats(req, res, next) {
    try {
      const ClientAdmin = await getClientAdminModel();
    
      const totalTenants = await ClientAdmin.countDocuments();
      const activeTenants = await ClientAdmin.countDocuments({
        isActive: true,
        subscriptionExpiresAt: { $gte: new Date() },
      });
      const expiredTenants = await ClientAdmin.countDocuments({
        isActive: true,
        $or: [
          { subscriptionExpiresAt: { $lt: new Date() } },
          { subscriptionExpiresAt: null },
        ],
      });
      
      // For shops we would need to aggregate across all client DBs, which is expensive.
      // For now, we can omit it or keep a cache. 
      // Or we can just sum up the active shops if we stored them in ClientAdmin (which we don't yet).
      // Let's return 0 for now to avoid errors, or try to count if feasible.
      const totalShops = 0; // Placeholder

      // Get tenants expiring soon (within 7 days)
      const expiringSoon = await ClientAdmin.countDocuments({
        isActive: true,
        subscriptionExpiresAt: {
          $gte: moment().toDate(),
          $lte: moment().add(7, 'days').toDate(),
        },
      });

      const SubscriptionPayment = require('../platform/models/SubscriptionPayment');
      // Get recent payments (last 30 days)
      const recentPayments = await SubscriptionPayment.find({
        paymentDate: {
          $gte: moment().subtract(30, 'days').toDate(),
        },
      });

      const totalRevenue = recentPayments.reduce((sum, p) => sum + p.amount, 0);

      res.json({
        success: true,
        stats: {
          totalTenants,
          activeTenants,
          expiredTenants,
          totalShops,
          expiringSoon,
          recentRevenue: totalRevenue,
          recentPaymentsCount: recentPayments.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Client Admin (Tenant) with Database
   * Creates a new client database and initializes it with client admin user
   */
  async createTenant(req, res, next) {
    try {
      const {
        email,
        phone,
        subscriptionPlan,
        maxShops,
        maxStaff,
        adminPassword,
        adminFirstName,
        adminLastName,
        adminPhone,
      } = req.body;

      logger.info(`SuperAdminController.createTenant: Creating new tenant for email=${email}`);

      if (!email || !phone) {
        throw new ValidationError('Email and phone are required');
      }

      if (!adminPassword || !adminFirstName || !adminLastName) {
        throw new ValidationError('Client admin password, first name, and last name are required');
      }

      // Check if client admin already exists
      const ClientAdmin = getClientAdminModel();
      const existingClientAdmin = await ClientAdmin.findOne({ email: email.toLowerCase() });

      if (existingClientAdmin) {
        throw new ValidationError('Client admin with this email already exists');
      }

      // Set 3-day demo period
      const demoExpiry = moment().add(3, 'days').toDate();

      // Create client database and initialize
      const result = await clientDatabaseService.createClientDatabase({
        email,
        firstName: adminFirstName,
        lastName: adminLastName,
        phone: adminPhone || phone,
        password: adminPassword,
        maxShops: maxShops || 10,
        maxStaff: maxStaff || 50,
        subscriptionPlan: subscriptionPlan || 'basic',
        subscriptionExpiresAt: demoExpiry,
      });

      const { clientId, databaseName, clientAdmin } = result;

      res.status(201).json({
        success: true,
        message: 'Client admin and database created successfully with 3-day demo period',
        client: {
          clientId,
          databaseName,
          email: clientAdmin.email,
          firstName: clientAdmin.firstName,
          lastName: clientAdmin.lastName,
          phone: clientAdmin.phone,
          maxShops: clientAdmin.maxShops,
          maxStaff: clientAdmin.maxStaff,
          subscriptionPlan: clientAdmin.subscriptionPlan,
          subscriptionExpiresAt: demoExpiry,
          daysUntilExpiry: 3,
          isActive: clientAdmin.isActive,
          createdAt: clientAdmin.createdAt,
        },
        adminUser: {
          email: clientAdmin.email,
          firstName: clientAdmin.firstName,
          lastName: clientAdmin.lastName,
          phone: clientAdmin.phone,
        },
      });

      logger.info(`SuperAdminController.createTenant: Successfully created tenant with databaseName=${databaseName}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Tenant
   */
  async updateTenant(req, res, next) {
    try {
      const { tenantId } = req.params;
      const updates = req.body;

      const ClientAdmin = await getClientAdminModel();
      const tenant = await ClientAdmin.findById(tenantId);

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      Object.assign(tenant, updates);
      await tenant.save();

      res.json({
        success: true,
        tenant,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Client Admin User for Tenant
   */
  async createClientAdmin(req, res, next) {
    try {
      const { tenantId } = req.params;
      const { email, password, firstName, lastName, phone } = req.body;

      if (!email || !password || !firstName || !lastName) {
        throw new ValidationError('Email, password, first name, and last name are required');
      }

      // Verify tenant exists in platform db
      const ClientAdmin = await getClientAdminModel();
      const tenant = await ClientAdmin.findById(tenantId);

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      // Connect to Client DB
      const db = await connectionManager.getDb(tenant.databaseName);
      // We need to use Model Factory or getModel helper to check for User in that specific DB
      const userSchema = require('../client/models/User').schema;
      const roleSchema = require('../client/models/Role').schema;
      
      const User = await getModel(tenant.databaseName, 'User', userSchema);
      const Role = await getModel(tenant.databaseName, 'Role', roleSchema);
      
      const { ROLES, PERMISSIONS } = require('../config/constants');

      // Check if user already exists in client db
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        throw new ValidationError('User with this email already exists for this tenant');
      }

      // Get or create client admin role
      let role = await Role.findOne({
        tenantId: tenant._id,
        name: ROLES.CLIENT_ADMIN,
      });

      if (!role) {
        role = await Role.create({
          tenantId: tenant._id,
          name: ROLES.CLIENT_ADMIN,
          permissions: [
            PERMISSIONS.MANAGE_SHOPS,
            PERMISSIONS.MANAGE_STAFF,
            PERMISSIONS.MANAGE_SERVICES,
            PERMISSIONS.VIEW_DASHBOARD,
            PERMISSIONS.MANAGE_SLOTS,
            PERMISSIONS.VIEW_INVOICES,
            PERMISSIONS.MANAGE_SETTINGS,
          ],
          isSystemRole: true,
        });
      }

      // Create client admin user
      const adminUser = await User.create({
        // tenantId is not needed inside the client specific database usually, 
        // but if the schema requires it we can pass it, though usually client DB is isolated.
        // Checking User schema... it has tenantId. 
        // But since we are inside a client-specific DB, the tenantId might be redundant or expected to be the platform ID?
        // Let's pass it if schema requires it.
        tenantId: tenant._id, 
        email,
        password,
        phone: phone || tenant.phone,
        firstName,
        lastName,
        role: ROLES.CLIENT_ADMIN,
        roleId: role._id,
        isActive: true,
      });

      res.status(201).json({
        success: true,
        message: 'Client admin user created successfully',
        user: {
          id: adminUser._id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
          role: adminUser.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Client Admin Password
   */
  async updateClientAdminPassword(req, res, next) {
    try {
      const { tenantId, userId } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        throw new ValidationError('Password is required and must be at least 6 characters');
      }

      // Verify tenant exists
      const ClientAdmin = await getClientAdminModel();
      const tenant = await ClientAdmin.findById(tenantId);

      if (!tenant) {
        throw new NotFoundError('Tenant');
      }

      const userSchema = require('../client/models/User').schema;
      const User = await getModel(tenant.databaseName, 'User', userSchema);
      const { ROLES } = require('../config/constants');

      // Find user and verify it's a client admin
      const user = await User.findOne({
        _id: userId,
        role: ROLES.CLIENT_ADMIN,
      });

      if (!user) {
        throw new NotFoundError('Client admin user');
      }

      // Update password
      user.password = password;
      await user.save();

      res.json({
        success: true,
        message: 'Client admin password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SuperAdminController();

