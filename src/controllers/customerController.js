const Service = require('../models/Service');
const Shop = require('../models/Shop');
const logger = require('../utils/logger');
const slotService = require('../services/slotService');
const bookingService = require('../services/bookingService');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { BOOKING_ADVANCE_DAYS } = require('../config/constants');
const moment = require('moment');
const { getPaginationParams, formatPaginatedResponse } = require('../utils/pagination');

/**
 * Customer Controller
 * Handles customer-facing operations
 */
class CustomerController {
  /**
   * Get Shop Services
   */
  async getShopServices(req, res, next) {
    try {
      const { shopId } = req.params;
      const tenantId = req.tenantId;

      logger.info(`CustomerController.getShopServices: Fetching services for shopId=${shopId}, tenantId=${tenantId}`);

      const { page, limit, skip } = getPaginationParams(req.query);

      const query = {
        tenantId,
        shopId,
        isActive: true,
      };

      const services = await Service.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Service.countDocuments(query);

      logger.info(`CustomerController.getShopServices: Found ${services.length} services out of total ${total}`);

      res.json(formatPaginatedResponse(services, total, { page, limit }, 'services'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Available Slots
   */
  async getAvailableSlots(req, res, next) {
    try {
      const { shopId } = req.params;
      const { startDate, endDate } = req.query;
      const tenantId = req.tenantId;

      logger.info(`CustomerController.getAvailableSlots: Getting slots for shopId=${shopId}, range=${startDate || 'today'} to ${endDate || 'default'}`);

      // Default to today and booking advance days
      const today = moment().startOf('day');
      const defaultEndDate = moment().add(BOOKING_ADVANCE_DAYS, 'days');

      const slots = await slotService.getAvailableSlots(
        tenantId,
        shopId,
        startDate ? new Date(startDate) : today.toDate(),
        endDate ? new Date(endDate) : defaultEndDate.toDate()
      );

      res.json({
        success: true,
        slots,
      });

      logger.info(`CustomerController.getAvailableSlots: Returned ${slots.length} daily slot groups`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Book Slot
   */
  async bookSlot(req, res, next) {
    try {
      const { shopId } = req.params;
      const { slotId, serviceId } = req.body;
      const tenantId = req.tenantId;

      logger.info(`CustomerController.bookSlot: Initiating booking for shopId=${shopId}, slotId=${slotId}, serviceId=${serviceId}`);

      if (!slotId || !serviceId) {
        throw new ValidationError('Slot ID and service ID are required');
      }

      if (!req.user || req.user.role !== 'customer') {
        throw new ValidationError('Customer authentication required');
      }

      const booking = await bookingService.createOnlineBooking(
        tenantId,
        shopId,
        slotId,
        serviceId,
        req.user._id
      );

      res.status(201).json({
        success: true,
        booking,
      });

      logger.info(`CustomerController.bookSlot: Successfully created booking with ID=${booking._id}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Booking History
   */
  async getBookingHistory(req, res, next) {
    try {
      const tenantId = req.tenantId;

      logger.info(`CustomerController.getBookingHistory: Fetching history for customerId=${req.user?._id}`);

      if (!req.user || req.user.role !== 'customer') {
        throw new ValidationError('Customer authentication required');
      }

      const { page, limit, skip } = getPaginationParams(req.query);

      const { bookings, total } = await bookingService.getCustomerBookings(
        tenantId,
        req.user._id,
        { skip, limit }
      );

      res.json(formatPaginatedResponse(bookings, total, { page, limit }, 'bookings'));

      logger.info(`CustomerController.getBookingHistory: Returned ${bookings.length} bookings`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel Booking
   */
  async cancelBooking(req, res, next) {
    try {
      const { shopId, bookingId } = req.params;
      const { reason } = req.body;
      const tenantId = req.tenantId;

      logger.info(`CustomerController.cancelBooking: Attempting to cancel bookingId=${bookingId} for shopId=${shopId}`);

      if (!req.user || req.user.role !== 'customer') {
        throw new ValidationError('Customer authentication required');
      }

      // Verify booking belongs to customer
      const booking = await bookingService.getShopBookings(tenantId, shopId, {
        status: 'confirmed',
      });

      const customerBooking = booking.find(
        (b) => b._id.toString() === bookingId && b.customerId._id.toString() === req.user._id.toString()
      );

      if (!customerBooking) {
        throw new NotFoundError('Booking');
      }

      const cancelledBooking = await bookingService.cancelBooking(
        tenantId,
        shopId,
        bookingId,
        req.user._id,
        reason
      );

      res.json({
        success: true,
        booking: cancelledBooking,
      });

      logger.info(`CustomerController.cancelBooking: Successfully cancelled bookingId=${bookingId}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Shop Details
   */
  async getShopDetails(req, res, next) {
    try {
      const { shopId } = req.params;
      const tenantId = req.tenantId;

      logger.info(`CustomerController.getShopDetails: Fetching details for shopId=${shopId}`);

      const shop = await Shop.findOne({
        _id: shopId,
        tenantId,
        isActive: true,
      });

      if (!shop) {
        throw new NotFoundError('Shop');
      }

      res.json({
        success: true,
        shop,
      });

      logger.info(`CustomerController.getShopDetails: Successfully returned shop info for "${shop.name}"`);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();

