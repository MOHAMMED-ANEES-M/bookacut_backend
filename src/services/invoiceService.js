const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const ShopSettings = require('../models/ShopSettings');
const { v4: uuidv4 } = require('uuid');
const { INVOICE_STATUS } = require('../config/constants');

/**
 * Invoice Service
 * Handles invoice generation and management
 */
class InvoiceService {
  /**
   * Generate invoice for completed booking
   */
  async generateInvoice(tenantId, shopId, bookingId) {
    try {
      // Check if invoice already exists
      const existingInvoice = await Invoice.findOne({ bookingId });

      if (existingInvoice) {
        return existingInvoice;
      }

      // Get booking details
      const booking = await Booking.findOne({
        _id: bookingId,
        tenantId,
        shopId,
        status: 'completed',
      })
        .populate('serviceId')
        .populate('customerId');

      if (!booking) {
        throw new Error('Completed booking not found');
      }

      // Get shop settings for tax
      const settings = await ShopSettings.findOne({ tenantId, shopId });
      const taxRate = settings?.taxRate || 0;

      // Calculate amounts
      const amount = booking.finalPrice;
      const discount = booking.originalPrice - booking.finalPrice;
      const tax = (amount * taxRate) / 100;
      const totalAmount = amount + tax;

      // Generate invoice number
      const invoiceNumber = `INV-${tenantId.toString().slice(-6)}-${Date.now()}-${uuidv4().slice(0, 6).toUpperCase()}`;

      // Create invoice
      const invoice = await Invoice.create({
        tenantId,
        shopId,
        bookingId,
        invoiceNumber,
        customerId: booking.customerId._id,
        serviceId: booking.serviceId._id,
        amount,
        tax,
        discount,
        totalAmount,
        status: INVOICE_STATUS.PENDING,
      });

      return invoice;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markPaid(tenantId, shopId, invoiceId, paymentMethod) {
    try {
      const invoice = await Invoice.findOne({
        _id: invoiceId,
        tenantId,
        shopId,
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      invoice.status = INVOICE_STATUS.PAID;
      invoice.paidAt = new Date();
      invoice.paymentMethod = paymentMethod;

      await invoice.save();

      return invoice;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get invoices for a shop
   */
  async getShopInvoices(tenantId, shopId, filters = {}) {
    try {
      const query = {
        tenantId,
        shopId,
      };

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate),
        };
      }

      const invoices = await Invoice.find(query)
        .populate('customerId', 'firstName lastName phone email')
        .populate('serviceId', 'name')
        .populate('bookingId', 'scheduledAt')
        .sort({ createdAt: -1 });

      return invoices;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get revenue statistics
   */
  async getRevenueStats(tenantId, shopId, startDate, endDate) {
    try {
      const invoices = await Invoice.find({
        tenantId,
        shopId,
        status: INVOICE_STATUS.PAID,
        paidAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      });

      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalTax = invoices.reduce((sum, inv) => sum + inv.tax, 0);
      const totalDiscount = invoices.reduce((sum, inv) => sum + inv.discount, 0);
      const totalInvoices = invoices.length;

      return {
        totalRevenue,
        totalTax,
        totalDiscount,
        totalInvoices,
        averageInvoiceValue: totalInvoices > 0 ? totalRevenue / totalInvoices : 0,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InvoiceService();

