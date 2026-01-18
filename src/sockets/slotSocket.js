const Slot = require('../models/Slot');
const Booking = require('../models/Booking');

/**
 * Socket.IO Handler for Real-time Slot Updates
 */
class SlotSocket {
  constructor(io) {
    this.io = io;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join shop room for real-time updates
      socket.on('join-shop', async ({ tenantId, shopId }) => {
        const room = `shop-${tenantId}-${shopId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room: ${room}`);

        // Send current slot status
        this.emitSlotUpdates(tenantId, shopId);
      });

      // Leave shop room
      socket.on('leave-shop', ({ tenantId, shopId }) => {
        const room = `shop-${tenantId}-${shopId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Emit slot updates to all clients in a shop room
   */
  async emitSlotUpdates(tenantId, shopId) {
    try {
      const slots = await Slot.find({
        tenantId,
        shopId,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }).sort({ date: 1, startTime: 1 });

      const room = `shop-${tenantId}-${shopId}`;
      this.io.to(room).emit('slot-updates', {
        success: true,
        slots,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error emitting slot updates:', error);
    }
  }

  /**
   * Notify about booking changes
   */
  async notifyBookingChange(tenantId, shopId, booking) {
    try {
      const room = `shop-${tenantId}-${shopId}`;
      
      // Emit booking update
      this.io.to(room).emit('booking-updated', {
        success: true,
        booking,
        timestamp: new Date().toISOString(),
      });

      // Also update slots
      await this.emitSlotUpdates(tenantId, shopId);
    } catch (error) {
      console.error('Error notifying booking change:', error);
    }
  }

  /**
   * Notify about slot capacity changes
   */
  async notifySlotCapacityChange(tenantId, shopId) {
    await this.emitSlotUpdates(tenantId, shopId);
  }
}

module.exports = SlotSocket;

