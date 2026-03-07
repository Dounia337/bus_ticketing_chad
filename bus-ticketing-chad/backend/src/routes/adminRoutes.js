const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');

// All admin routes require authentication and ADMIN or AGENT role
router.use(authenticate);
router.use(authorize('ADMIN', 'AGENT'));

// Import admin controllers
const adminController = require('../controllers/adminController');

// Routes
router.get('/dashboard', adminController.getDashboard);

// Route management
router.get('/routes', adminController.getAllRoutes);
router.post('/routes', adminController.createRoute);
router.put('/routes/:id', adminController.updateRoute);
router.delete('/routes/:id', adminController.deleteRoute);

// Bus management
router.get('/buses', adminController.getAllBuses);
router.post('/buses', adminController.createBus);
router.put('/buses/:id', adminController.updateBus);
router.delete('/buses/:id', adminController.deleteBus);

// Trip management
router.get('/trips', adminController.getAllTrips);
router.post('/trips', adminController.createTrip);
router.put('/trips/:id', adminController.updateTrip);
router.put('/trips/:id/status', adminController.updateTripStatus);
router.get('/trips/:id/manifest', adminController.getTripManifest);

// Booking management
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id/confirm', adminController.confirmBooking);
router.put('/bookings/:id/cancel', adminController.cancelBookingAdmin);

// Payment management
router.get('/payments', adminController.getAllPayments);
router.put('/payments/:id/confirm', adminController.confirmPayment);
router.put('/payments/:id/refund', adminController.refundPayment);

// Reports
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/bookings', adminController.getBookingReport);

module.exports = router;
