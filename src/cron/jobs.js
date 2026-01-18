const cron = require('node-cron');
const cronService = require('../services/cronService');
const logger = require('../utils/logger');

/**
 * Cron Jobs Configuration
 * Handles scheduled tasks
 */

// Run every minute to check for no-shows
cron.schedule('* * * * *', async () => {
  try {
    logger.info('Running no-show check cron job');
    await cronService.handleNoShows();
  } catch (error) {
    logger.error('Error in no-show cron job:', error);
  }
});

// Run daily at 2 AM to generate upcoming slots
cron.schedule('0 2 * * *', async () => {
  try {
    logger.info('Running slot generation cron job');
    await cronService.generateUpcomingSlots();
  } catch (error) {
    logger.error('Error in slot generation cron job:', error);
  }
});

// Run every hour to update slot capacities based on staff changes
cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Running slot capacity update cron job');
    const Shop = require('../models/Shop');
    const slotService = require('../services/slotService');
    
    const shops = await Shop.find({ isActive: true });
    
    for (const shop of shops) {
      try {
        await slotService.updateSlotCapacity(shop.tenantId, shop._id, new Date());
      } catch (error) {
        logger.error(`Error updating slots for shop ${shop._id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in slot capacity update cron job:', error);
  }
});

// Run daily at 3 AM to check for expired subscriptions
cron.schedule('0 3 * * *', async () => {
  try {
    logger.info('Running subscription expiry check cron job');
    const Tenant = require('../models/Tenant');
    const moment = require('moment');
    
    const tenants = await Tenant.find({ isActive: true });
    const today = moment().startOf('day');
    
    for (const tenant of tenants) {
      if (tenant.subscriptionExpiresAt) {
        const expiryDate = moment(tenant.subscriptionExpiresAt).startOf('day');
        
        if (expiryDate.isBefore(today)) {
          logger.warn(`Tenant ${tenant._id} (${tenant.email}) subscription expired on ${expiryDate.format('YYYY-MM-DD')}`);
          // You can add logic here to send notifications or disable access
        } else if (expiryDate.isSameOrBefore(today.add(7, 'days'))) {
          logger.info(`Tenant ${tenant._id} (${tenant.email}) subscription expires soon on ${expiryDate.format('YYYY-MM-DD')}`);
          // You can add logic here to send renewal reminders
        }
      }
    }
  } catch (error) {
    logger.error('Error in subscription expiry check cron job:', error);
  }
});

logger.info('Cron jobs initialized');

module.exports = cron;

