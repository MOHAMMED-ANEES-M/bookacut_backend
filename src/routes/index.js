const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const clientAdminRoutes = require('./clientAdminRoutes');
const staffRoutes = require('./staffRoutes');
const customerRoutes = require('./customerRoutes');
const superAdminRoutes = require('./superAdminRoutes');

/**
 * API Routes
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Route modules
router.use('/auth', authRoutes);
router.use('/super-admin', superAdminRoutes);
router.use('/admin', clientAdminRoutes);
router.use('/staff', staffRoutes);
router.use('/customer', customerRoutes);

module.exports = router;

