require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const SlotSocket = require('./sockets/slotSocket');

// Initialize cron jobs
require('./cron/jobs');

/**
 * Server Setup
 */
const PORT = process.env.PORT || 5001;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// Initialize Socket handlers
const slotSocket = new SlotSocket(io);

// Make io available globally for use in controllers/services
global.io = io;
global.slotSocket = slotSocket;

// Connect to MongoDB
connectDB()
  .then(() => {
    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

