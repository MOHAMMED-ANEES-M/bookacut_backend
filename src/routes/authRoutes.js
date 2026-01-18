const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validator');

/**
 * Auth Routes
 */

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
  authController.login.bind(authController)
);

// Register Customer
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('phone').notEmpty(),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('tenantId').notEmpty(),
    validate,
  ],
  authController.registerCustomer.bind(authController)
);

// Get Current User
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

module.exports = router;

