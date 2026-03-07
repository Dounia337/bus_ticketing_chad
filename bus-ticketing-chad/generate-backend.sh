#!/bin/bash

# Chad Bus Ticketing System - Backend File Generator
# This script creates all remaining backend files

echo "🚌 Generating remaining backend files for Chad Bus Ticketing System..."

cd /home/claude/bus-ticketing-chad/backend/src

# Create trip routes
cat > routes/tripRoutes.js << 'EOF'
const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.get('/search', tripController.searchTrips);
router.get('/routes/available', tripController.getAvailableRoutes);
router.get('/cities', tripController.getCities);
router.get('/:id', tripController.getTripDetails);

module.exports = router;
EOF

# Create booking routes
cat > routes/bookingRoutes.js << 'EOF'
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { validate } = require('../middlewares/validation');
const { optionalAuth, authenticate } = require('../middlewares/auth');

router.post('/', optionalAuth, [
  body('tripId').isUUID().withMessage('ID de voyage invalide'),
  body('passengers').isArray({ min: 1 }).withMessage('Au moins un passager requis'),
  body('contactName').trim().notEmpty().withMessage('Nom de contact requis'),
  body('contactPhone').trim().notEmpty().withMessage('Téléphone requis'),
], validate, bookingController.createBooking);

router.get('/my/list', authenticate, bookingController.getMyBookings);
router.get('/:identifier', optionalAuth, bookingController.getBooking);
router.put('/:id/cancel', optionalAuth, bookingController.cancelBooking);
router.get('/:id/ticket', optionalAuth, bookingController.getTicket);

module.exports = router;
EOF

# Create payment routes
cat > routes/paymentRoutes.js << 'EOF'
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { validate } = require('../middlewares/validation');
const { asyncHandler } = require('../middlewares/errorHandler');
const paymentService = require('../services/paymentService');

router.post('/:bookingId/initiate', [
  body('method').isIn(['MOMO_AIRTEL', 'MOMO_MOOV', 'MOMO_TIGO', 'CASH']),
  body('phoneNumber').optional(),
], validate, asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { amount, method, phoneNumber } = req.body;
  const result = await paymentService.initiatePayment(bookingId, amount, method, phoneNumber);
  res.json({ success: true, data: result });
}));

router.get('/:transactionRef/verify', asyncHandler(async (req, res) => {
  const { transactionRef } = req.params;
  const result = await paymentService.verifyMoMoPayment(transactionRef);
  res.json({ success: true, data: result });
}));

module.exports = router;
EOF

# Create admin routes
cat > routes/adminRoutes.js << 'EOF'
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
EOF

# Create admin controller
cat > controllers/adminController.js << 'EOF'
const { prisma } = require('../config/database');
const { ApiError, asyncHandler } = require('../middlewares/errorHandler');
const { getMessage } = require('../config/messages');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

// Dashboard stats
exports.getDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [totalBookings, todayBookings, totalRevenue, activeTrips] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: today } } }),
    prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.trip.count({ where: { status: { in: ['SCHEDULED', 'BOARDING'] } } }),
  ]);
  
  res.json({ success: true, data: { totalBookings, todayBookings, totalRevenue: totalRevenue._sum.amount || 0, activeTrips } });
});

// Routes
exports.getAllRoutes = asyncHandler(async (req, res) => {
  const routes = await prisma.route.findMany({ orderBy: { originCity: 'asc' } });
  res.json({ success: true, data: { routes } });
});

exports.createRoute = asyncHandler(async (req, res) => {
  const route = await prisma.route.create({ data: req.body });
  res.status(201).json({ success: true, messageKey: 'ROUTE_CREATED', message: getMessage('ROUTE_CREATED'), data: { route } });
});

exports.updateRoute = asyncHandler(async (req, res) => {
  const route = await prisma.route.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, messageKey: 'ROUTE_UPDATED', message: getMessage('ROUTE_UPDATED'), data: { route } });
});

exports.deleteRoute = asyncHandler(async (req, res) => {
  await prisma.route.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, messageKey: 'ROUTE_DELETED', message: getMessage('ROUTE_DELETED') });
});

// Buses
exports.getAllBuses = asyncHandler(async (req, res) => {
  const buses = await prisma.bus.findMany({ include: { seats: true }, orderBy: { busNumber: 'asc' } });
  res.json({ success: true, data: { buses } });
});

exports.createBus = asyncHandler(async (req, res) => {
  const { capacity, ...busData } = req.body;
  const bus = await prisma.$transaction(async (tx) => {
    const newBus = await tx.bus.create({ data: { ...busData, capacity } });
    const seats = Array.from({ length: capacity }, (_, i) => ({ busId: newBus.id, seatNumber: i + 1 }));
    await tx.seat.createMany({ data: seats });
    return newBus;
  });
  res.status(201).json({ success: true, messageKey: 'BUS_CREATED', message: getMessage('BUS_CREATED'), data: { bus } });
});

exports.updateBus = asyncHandler(async (req, res) => {
  const bus = await prisma.bus.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, messageKey: 'BUS_UPDATED', message: getMessage('BUS_UPDATED'), data: { bus } });
});

exports.deleteBus = asyncHandler(async (req, res) => {
  await prisma.bus.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true, messageKey: 'BUS_DELETED', message: getMessage('BUS_DELETED') });
});

// Trips
exports.getAllTrips = asyncHandler(async (req, res) => {
  const trips = await prisma.trip.findMany({ include: { route: true, bus: true }, orderBy: { departureDate: 'desc' }, take: 100 });
  res.json({ success: true, data: { trips } });
});

exports.createTrip = asyncHandler(async (req, res) => {
  const { routeId, busId, departureDate, departureTime, currentPrice } = req.body;
  const bus = await prisma.bus.findUnique({ where: { id: busId } });
  const trip = await prisma.trip.create({ data: { routeId, busId, departureDate: new Date(departureDate), departureTime, currentPrice, availableSeats: bus.capacity } });
  res.status(201).json({ success: true, messageKey: 'TRIP_CREATED', message: getMessage('TRIP_CREATED'), data: { trip } });
});

exports.updateTrip = asyncHandler(async (req, res) => {
  const trip = await prisma.trip.update({ where: { id: req.params.id }, data: req.body });
  res.json({ success: true, messageKey: 'TRIP_UPDATED', message: getMessage('TRIP_UPDATED'), data: { trip } });
});

exports.updateTripStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const trip = await prisma.trip.update({ where: { id: req.params.id }, data: { status } });
  res.json({ success: true, data: { trip } });
});

exports.getTripManifest = asyncHandler(async (req, res) => {
  const passengers = await prisma.passenger.findMany({ where: { booking: { tripId: req.params.id, status: 'CONFIRMED' } }, include: { booking: true, seat: true } });
  res.json({ success: true, data: { passengers } });
});

// Bookings
exports.getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({ include: { trip: { include: { route: true } }, passengers: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ success: true, data: { bookings } });
});

exports.confirmBooking = asyncHandler(async (req, res) => {
  const booking = await prisma.booking.update({ where: { id: req.params.id }, data: { status: 'CONFIRMED' } });
  res.json({ success: true, data: { booking } });
});

exports.cancelBookingAdmin = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await prisma.booking.update({ where: { id: req.params.id }, data: { status: 'CANCELLED', notes: reason } });
  res.json({ success: true, data: { booking } });
});

// Payments
exports.getAllPayments = asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({ include: { booking: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json({ success: true, data: { payments } });
});

exports.confirmPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.confirmPayment(req.params.id, req.user.id);
  res.json({ success: true, messageKey: 'PAYMENT_CONFIRMED', message: getMessage('PAYMENT_CONFIRMED'), data: result });
});

exports.refundPayment = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const payment = await paymentService.processRefund(req.params.id, req.user.id, reason);
  res.json({ success: true, data: { payment } });
});

// Reports
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const revenue = await prisma.payment.aggregate({ where: { status: 'PAID', createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }, _sum: { amount: true } });
  res.json({ success: true, data: { totalRevenue: revenue._sum.amount || 0 } });
});

exports.getBookingReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const bookings = await prisma.booking.findMany({ where: { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }, include: { trip: { include: { route: true } } } });
  res.json({ success: true, data: { bookings } });
});

module.exports = exports;
EOF

# Create seed script
cat > scripts/seed.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phoneNumber: '+23566778899' },
    update: {},
    create: {
      fullName: 'Administrateur',
      phoneNumber: '+23566778899',
      email: 'admin@chadbusticketing.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.phoneNumber);
  
  // Create routes
  const routes = [
    { originCity: "N'Djamena", destinationCity: 'Moundou', basePrice: 15000, distance: 475, estimatedDuration: 480 },
    { originCity: "N'Djamena", destinationCity: 'Sarh', basePrice: 12000, distance: 585, estimatedDuration: 540 },
    { originCity: "N'Djamena", destinationCity: 'Abéché', basePrice: 18000, distance: 900, estimatedDuration: 720 },
    { originCity: 'Moundou', destinationCity: 'Sarh', basePrice: 8000, distance: 320, estimatedDuration: 300 },
  ];
  
  for (const route of routes) {
    await prisma.route.upsert({
      where: { originCity_destinationCity: { originCity: route.originCity, destinationCity: route.destinationCity } },
      update: {},
      create: route,
    });
  }
  console.log('✅ Routes created');
  
  // Create buses
  const buses = [
    { busNumber: 'BUS001', capacity: 40, plateNumber: 'TD-001-ND', condition: 'GOOD', model: 'Mercedes Sprinter' },
    { busNumber: 'BUS002', capacity: 35, plateNumber: 'TD-002-ND', condition: 'GOOD', model: 'Toyota Coaster' },
  ];
  
  for (const bus of buses) {
    const newBus = await prisma.bus.upsert({
      where: { busNumber: bus.busNumber },
      update: {},
      create: bus,
    });
    
    const existingSeats = await prisma.seat.count({ where: { busId: newBus.id } });
    if (existingSeats === 0) {
      const seats = Array.from({ length: bus.capacity }, (_, i) => ({ busId: newBus.id, seatNumber: i + 1 }));
      await prisma.seat.createMany({ data: seats });
    }
  }
  console.log('✅ Buses and seats created');
  
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

chmod +x scripts/seed.js

echo "✅ All backend files generated successfully!"
echo "📝 Files created:"
echo "  - routes/tripRoutes.js"
echo "  - routes/bookingRoutes.js"
echo "  - routes/paymentRoutes.js"
echo "  - routes/adminRoutes.js"
echo "  - controllers/adminController.js"
echo "  - scripts/seed.js"
