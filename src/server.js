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
  .then((connection) => {
    // Start server
    server.listen(PORT, () => {
      // Parse MongoDB URI for display
      const mongoUri = process.env.MONGODB_URI || '';
      const uriParts = mongoUri.split('@');
      // Get DB name from connection object or fallback to parsing if needed
      // DEBUG: Inspect connection object
      // console.log('DEBUG: Connection keys:', Object.keys(connection || {}));
      // console.log('DEBUG: connection.name:', connection?.name);
      // console.log('DEBUG: connection.host:', connection?.host);
      
      const dbName = connection?.name || connection?.db?.databaseName || 'platform_db';
      const host = connection?.host || (uriParts.length > 1 ? uriParts[1].split('/')[0] : 'localhost');

      console.log('\n✨ Hey Bookacut✨');
      console.log('🚀 Your Database is Now Live');
      console.log(`🔗 Connected to: ${host}`);
      console.log(`📂 Database Name: ${dbName}`);
      console.log(`Server is running on port ${PORT}\n`);
      
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

