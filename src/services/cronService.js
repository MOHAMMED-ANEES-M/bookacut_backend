const moment = require('moment');
const { BOOKING_STATUS } = require('../config/constants');
const bookingService = require('./bookingService');
const { getModel } = require('../database/modelFactory');
const connectionManager = require('../database/connectionManager');
const { getModel: getClientDatabaseMapModel } = require('../platform/models/ClientDatabaseMap');

/**
 * Cron Service
 * Handles scheduled tasks like auto no-show handling
 */
class CronService {
  /**
   * Auto handle no-show bookings
   * Runs every minute to check for bookings that should be marked as no-show
   */
  async handleNoShows() {
    try {
      const now = moment();
      const timeoutMinutes = parseInt(process.env.NO_SHOW_TIMEOUT_MINUTES) || 5;

      // Get all client databases
      const ClientDatabaseMap = await getClientDatabaseMapModel();
      const clientDatabases = await ClientDatabaseMap.find({});

      let totalProcessed = 0;

      // Process each client database
      for (const clientDb of clientDatabases) {
        try {
          const databaseName = clientDb.databaseName;

          // Get models for this specific database
          const BookingSchema = require('../models/Booking').schema;
          const ShopSettingsSchema = require('../models/ShopSettings').schema;

          const Booking = await getModel(databaseName, 'Booking', BookingSchema);
          const ShopSettings = await getModel(databaseName, 'ShopSettings', ShopSettingsSchema);

          // Find confirmed bookings that are past their scheduled time + timeout
          const bookings = await Booking.find({
            status: BOOKING_STATUS.CONFIRMED,
            scheduledAt: {
              $lte: moment().subtract(timeoutMinutes, 'minutes').toDate(),
            },
          })
            .populate('slotId')
            .populate('shopId');

          for (const booking of bookings) {
            try {
              // Get shop-specific timeout if available
              const settings = await ShopSettings.findOne({
                tenantId: booking.tenantId,
                shopId: booking.shopId._id,
              });

              const shopTimeout = settings?.noShowTimeoutMinutes || timeoutMinutes;
              const shouldMarkNoShow = moment(booking.scheduledAt).add(shopTimeout, 'minutes').isBefore(now);

              if (shouldMarkNoShow) {
                await bookingService.markNoShow(
                  booking.tenantId,
                  booking.shopId._id,
                  booking._id,
                  databaseName
                );

                console.log(`Marked booking ${booking._id} as no-show in ${databaseName}`);
              }
            } catch (error) {
              console.error(`Error processing no-show for booking ${booking._id} in ${databaseName}:`, error);
            }
          }

          totalProcessed += bookings.length;
        } catch (error) {
          console.error(`Error processing database ${clientDb.databaseName}:`, error);
        }
      }

      return { processed: totalProcessed };
    } catch (error) {
      console.error('Error in handleNoShows cron:', error);
      throw error;
    }
  }

  /**
   * Generate slots for upcoming days
   * Runs daily to ensure slots are available for booking advance period
   */
  async generateUpcomingSlots() {
    try {
      const Shop = require('../models/Shop');
      const slotService = require('./slotService');
      const { BOOKING_ADVANCE_DAYS } = require('../config/constants');

      const shops = await Shop.find({ isActive: true });

      for (const shop of shops) {
        try {
          const today = moment().startOf('day');
          const endDate = moment().add(BOOKING_ADVANCE_DAYS, 'days');

          // Generate slots for the advance period
          await slotService.generateSlotsForDateRange(
            shop.tenantId,
            shop._id,
            today.toDate(),
            endDate.toDate()
          );

          console.log(`Generated slots for shop ${shop._id}`);
        } catch (error) {
          console.error(`Error generating slots for shop ${shop._id}:`, error);
        }
      }

      return { processed: shops.length };
    } catch (error) {
      console.error('Error in generateUpcomingSlots cron:', error);
      throw error;
    }
  }
}

module.exports = new CronService();

