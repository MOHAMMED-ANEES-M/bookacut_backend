const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const ShopSettings = require('../models/ShopSettings');
const StaffProfile = require('../models/StaffProfile');
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
        .populate('customerId')
        .populate('staffId');

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

      // Calculate commission if staff is assigned
      let commissionAmount = 0;
      let commissionRate = 0;
      let staffId = null;

      if (booking.staffId) {
        staffId = booking.staffId._id || booking.staffId;
        
        // Get staff profile to get commission rate
        const staffProfile = await StaffProfile.findOne({
          _id: staffId,
          tenantId,
          shopId,
          isActive: true,
        });

        if (staffProfile && staffProfile.commissionRate > 0) {
          commissionRate = staffProfile.commissionRate;
          // Commission is calculated on the amount (before tax)
          commissionAmount = (amount * commissionRate) / 100;
        }
      }

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
        staffId,
        amount,
        tax,
        discount,
        totalAmount,
        commissionAmount,
        commissionRate,
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
        .populate('staffId', 'employeeId')
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

  /**
   * Get commission report for a staff member
   */
  async getStaffCommissionReport(tenantId, shopId, staffId, startDate, endDate) {
    try {
      const query = {
        tenantId,
        shopId,
        staffId,
        status: INVOICE_STATUS.PAID,
      };

      if (startDate && endDate) {
        query.paidAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const invoices = await Invoice.find(query)
        .populate('serviceId', 'name')
        .populate('customerId', 'firstName lastName')
        .sort({ paidAt: -1 });

      const totalCommission = invoices.reduce((sum, inv) => sum + inv.commissionAmount, 0);
      const totalSales = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalServices = invoices.length;

      return {
        staffId,
        period: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
        summary: {
          totalCommission,
          totalSales,
          totalServices,
          averageCommission: totalServices > 0 ? totalCommission / totalServices : 0,
        },
        invoices,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get commission report for all staff in a shop
   */
  async getShopCommissionReport(tenantId, shopId, startDate, endDate) {
    try {
      const query = {
        tenantId,
        shopId,
        status: INVOICE_STATUS.PAID,
        staffId: { $ne: null },
      };

      if (startDate && endDate) {
        query.paidAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const invoices = await Invoice.find(query)
        .populate('staffId', 'employeeId')
        .populate('serviceId', 'name')
        .populate('customerId', 'firstName lastName')
        .sort({ paidAt: -1 });

      // Group by staff
      const staffCommissions = {};
      
      invoices.forEach((invoice) => {
        const staffId = invoice.staffId._id.toString();
        if (!staffCommissions[staffId]) {
          staffCommissions[staffId] = {
            staffId: invoice.staffId._id,
            staffInfo: {
              employeeId: invoice.staffId.employeeId,
            },
            totalCommission: 0,
            totalSales: 0,
            totalServices: 0,
            invoices: [],
          };
        }
        
        staffCommissions[staffId].totalCommission += invoice.commissionAmount;
        staffCommissions[staffId].totalSales += invoice.totalAmount;
        staffCommissions[staffId].totalServices += 1;
        staffCommissions[staffId].invoices.push(invoice);
      });

      // Convert to array and calculate averages
      const staffList = Object.values(staffCommissions).map((staff) => ({
        ...staff,
        averageCommission: staff.totalServices > 0 ? staff.totalCommission / staff.totalServices : 0,
      }));

      const totalCommission = staffList.reduce((sum, staff) => sum + staff.totalCommission, 0);
      const totalSales = staffList.reduce((sum, staff) => sum + staff.totalSales, 0);
      const totalServices = staffList.reduce((sum, staff) => sum + staff.totalServices, 0);

      return {
        period: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
        summary: {
          totalCommission,
          totalSales,
          totalServices,
          totalStaff: staffList.length,
          averageCommission: totalServices > 0 ? totalCommission / totalServices : 0,
        },
        staffCommissions: staffList,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InvoiceService();

