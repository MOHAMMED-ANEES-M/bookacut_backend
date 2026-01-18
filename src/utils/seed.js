require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Role = require('../models/Role');
const Tenant = require('../models/Tenant');
const { ROLES, PERMISSIONS } = require('../config/constants');

/**
 * Seed Script
 * Initializes platform admin and default roles
 * Run with: node src/utils/seed.js
 */

async function seed() {
  try {
    // Connect to database
    await connectDB();

    console.log('Starting seed process...');

    // Create platform super admin role if it doesn't exist
    let platformAdminRole = await Role.findOne({ name: ROLES.PLATFORM_SUPER_ADMIN });

    if (!platformAdminRole) {
      platformAdminRole = await Role.create({
        tenantId: null,
        name: ROLES.PLATFORM_SUPER_ADMIN,
        permissions: Object.values(PERMISSIONS), // All permissions
        isSystemRole: true,
        description: 'Platform super administrator with full access',
      });
      console.log('✓ Created platform super admin role');
    } else {
      console.log('✓ Platform super admin role already exists');
    }

    // Create platform super admin user if it doesn't exist
    const adminEmail = process.env.PLATFORM_ADMIN_EMAIL || 'admin@bookacut.com';
    const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD || 'ChangeThisPassword123!';

    let platformAdmin = await User.findOne({ email: adminEmail, role: ROLES.PLATFORM_SUPER_ADMIN });

    if (!platformAdmin) {
      platformAdmin = await User.create({
        tenantId: null,
        email: adminEmail,
        password: adminPassword,
        phone: '0000000000',
        firstName: 'Platform',
        lastName: 'Admin',
        role: ROLES.PLATFORM_SUPER_ADMIN,
        roleId: platformAdminRole._id,
        isActive: true,
      });
      console.log('✓ Created platform super admin user');
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
      console.log('  ⚠️  Please change the password after first login!');
    } else {
      console.log('✓ Platform super admin user already exists');
    }

    // Create a sample tenant for testing (optional)
    const createSampleTenant = process.env.CREATE_SAMPLE_TENANT === 'true';

    if (createSampleTenant) {
      let sampleTenant = await Tenant.findOne({ email: 'sample@tenant.com' });

      if (!sampleTenant) {
        sampleTenant = await Tenant.create({
          name: 'Sample Tenant',
          email: 'sample@tenant.com',
          phone: '1234567890',
          isActive: true,
          subscriptionPlan: 'premium',
          maxShops: 5,
        });
        console.log('✓ Created sample tenant');
        console.log(`  Tenant ID: ${sampleTenant._id}`);
      } else {
        console.log('✓ Sample tenant already exists');
      }

      // Create default roles for tenant
      const tenantRoles = [
        {
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
        },
        {
          name: ROLES.STAFF,
          permissions: [
            PERMISSIONS.VIEW_BOOKINGS,
            PERMISSIONS.CREATE_WALKIN,
            PERMISSIONS.EDIT_PRICE,
            PERMISSIONS.MARK_ARRIVED,
            PERMISSIONS.MARK_NO_SHOW,
            PERMISSIONS.COMPLETE_SERVICE,
            PERMISSIONS.GENERATE_INVOICE,
          ],
        },
        {
          name: ROLES.CUSTOMER,
          permissions: [
            PERMISSIONS.VIEW_SERVICES,
            PERMISSIONS.VIEW_SLOTS,
            PERMISSIONS.BOOK_SLOT,
            PERMISSIONS.VIEW_BOOKING_HISTORY,
            PERMISSIONS.CANCEL_BOOKING,
          ],
        },
      ];

      for (const roleData of tenantRoles) {
        let role = await Role.findOne({
          tenantId: sampleTenant._id,
          name: roleData.name,
        });

        if (!role) {
          await Role.create({
            tenantId: sampleTenant._id,
            ...roleData,
            isSystemRole: true,
          });
          console.log(`✓ Created ${roleData.name} role for sample tenant`);
        }
      }
    }

    console.log('\n✓ Seed process completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm start');
    console.log('2. Login with platform admin credentials');
    console.log('3. Create your first tenant');
    console.log('4. Create shops and start managing!');

    process.exit(0);
  } catch (error) {
    console.error('Error during seed:', error);
    process.exit(1);
  }
}

// Run seed
seed();

