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
