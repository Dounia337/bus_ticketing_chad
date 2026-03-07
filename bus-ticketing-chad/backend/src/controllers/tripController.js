/**
 * Trip Controller
 * Handles trip search, availability, and scheduling
 */

const { prisma } = require('../config/database');
const { ApiError, asyncHandler } = require('../middlewares/errorHandler');
const { getMessage } = require('../config/messages');
const logger = require('../utils/logger');

/**
 * Search trips by route and date
 * 
 * GET /api/trips/search?origin=N'Djamena&destination=Moundou&date=2024-03-15
 */
const searchTrips = asyncHandler(async (req, res) => {
  const { origin, destination, date } = req.query;
  
  if (!origin || !destination || !date) {
    throw new ApiError('VALIDATION_ERROR', 400);
  }
  
  // Parse date
  const searchDate = new Date(date);
  searchDate.setHours(0, 0, 0, 0);
  
  const nextDay = new Date(searchDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Find trips
  const trips = await prisma.trip.findMany({
    where: {
      departureDate: {
        gte: searchDate,
        lt: nextDay,
      },
      status: {
        in: ['SCHEDULED', 'BOARDING'],
      },
      route: {
        originCity: {
          equals: origin,
          mode: 'insensitive',
        },
        destinationCity: {
          equals: destination,
          mode: 'insensitive',
        },
        isActive: true,
      },
    },
    include: {
      route: true,
      bus: {
        select: {
          id: true,
          busNumber: true,
          capacity: true,
          condition: true,
          model: true,
        },
      },
    },
    orderBy: {
      departureTime: 'asc',
    },
  });
  
  // Add availability percentage for each trip
  const tripsWithAvailability = trips.map(trip => ({
    ...trip,
    availabilityPercentage: Math.round((trip.availableSeats / trip.bus.capacity) * 100),
    isFull: trip.availableSeats === 0,
  }));
  
  res.json({
    success: true,
    data: {
      trips: tripsWithAvailability,
      count: tripsWithAvailability.length,
      searchCriteria: {
        origin,
        destination,
        date: searchDate.toISOString().split('T')[0],
      },
    },
  });
});

/**
 * Get trip details with seat availability
 * 
 * GET /api/trips/:id
 */
const getTripDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      route: true,
      bus: {
        include: {
          seats: {
            include: {
              passengers: {
                where: {
                  booking: {
                    tripId: id,
                    status: {
                      in: ['PENDING', 'CONFIRMED'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  
  if (!trip) {
    throw new ApiError('TRIP_NOT_FOUND', 404);
  }
  
  // Map seats with availability
  const seatsWithAvailability = trip.bus.seats.map(seat => ({
    id: seat.id,
    seatNumber: seat.seatNumber,
    isBooked: seat.passengers.length > 0,
    isActive: seat.isActive,
  }));
  
  res.json({
    success: true,
    data: {
      trip: {
        id: trip.id,
        route: trip.route,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        currentPrice: trip.currentPrice,
        availableSeats: trip.availableSeats,
        status: trip.status,
        boardingPoint: trip.boardingPoint,
        remarks: trip.remarks,
        bus: {
          busNumber: trip.bus.busNumber,
          capacity: trip.bus.capacity,
          condition: trip.bus.condition,
          model: trip.bus.model,
        },
        seats: seatsWithAvailability,
      },
    },
  });
});

/**
 * Get available routes
 * 
 * GET /api/trips/routes/available
 */
const getAvailableRoutes = asyncHandler(async (req, res) => {
  const routes = await prisma.route.findMany({
    where: { isActive: true },
    select: {
      id: true,
      originCity: true,
      destinationCity: true,
      basePrice: true,
      distance: true,
      estimatedDuration: true,
    },
    orderBy: [
      { originCity: 'asc' },
      { destinationCity: 'asc' },
    ],
  });
  
  res.json({
    success: true,
    data: { routes },
  });
});

/**
 * Get unique cities (for dropdown)
 * 
 * GET /api/trips/cities
 */
const getCities = asyncHandler(async (req, res) => {
  const routes = await prisma.route.findMany({
    where: { isActive: true },
    select: {
      originCity: true,
      destinationCity: true,
    },
  });
  
  const citiesSet = new Set();
  routes.forEach(route => {
    citiesSet.add(route.originCity);
    citiesSet.add(route.destinationCity);
  });
  
  const cities = Array.from(citiesSet).sort();
  
  res.json({
    success: true,
    data: { cities },
  });
});

module.exports = {
  searchTrips,
  getTripDetails,
  getAvailableRoutes,
  getCities,
};
