/**
 * Main API Routes
 * Combines all route modules
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const tripRoutes = require('./tripRoutes');
const bookingRoutes = require('./bookingRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Chad Bus Ticketing API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      trips: '/api/trips',
      bookings: '/api/bookings',
      payments: '/api/payments',
      admin: '/api/admin',
    },
  });
});

module.exports = router;
