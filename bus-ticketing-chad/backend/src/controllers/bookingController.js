/**
 * Booking Controller
 * Handles the complete booking workflow for Chad bus ticketing
 */

const { prisma } = require('../config/database');
const { ApiError, asyncHandler } = require('../middlewares/errorHandler');
const { getMessage, messages } = require('../config/messages');
const { normalizePhoneNumber } = require('../middlewares/validation');
const { sendNotification } = require('../services/whatsappService');
const { sendBookingConfirmationEmail } = require('../services/emailService');
const { generateTextTicket, generatePDFTicket, ensureUploadsDir } = require('../services/ticketService');
const logger = require('../utils/logger');
const path = require('path');

/**
 * Generate unique booking code
 */
const generateBookingCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = parseInt(process.env.BOOKING_CODE_LENGTH) || 6;
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return code;
};

/**
 * Calculate luggage fees
 */
const calculateLuggageFees = (numberOfBags, estimatedWeight, totalPassengers) => {
  const freeWeightPerPassenger = parseFloat(process.env.DEFAULT_LUGGAGE_FREE_WEIGHT) || 20;
  const extraFeePerKg = parseFloat(process.env.DEFAULT_LUGGAGE_EXTRA_FEE_PER_KG) || 500;
  
  const totalFreeWeight = freeWeightPerPassenger * totalPassengers;
  const excessWeight = Math.max(0, estimatedWeight - totalFreeWeight);
  const totalExtraFee = Math.round(excessWeight * extraFeePerKg);
  
  return {
    freeWeightLimit: totalFreeWeight,
    excessWeight,
    extraFeePerKg,
    totalExtraFee,
  };
};

/**
 * Create a new booking
 * 
 * POST /api/bookings
 * Body: {
 *   tripId,
 *   passengers: [{ fullName, seatId, age?, idNumber? }],
 *   luggage: { numberOfBags, estimatedWeight },
 *   contactName, contactPhone, contactEmail?,
 *   paymentMethod?: 'MOMO_AIRTEL' | 'MOMO_MOOV' | 'MOMO_TIGO' | 'CASH' | null
 * }
 */
const createBooking = asyncHandler(async (req, res) => {
  const {
    tripId,
    passengers,
    luggage,
    contactName,
    contactPhone,
    contactEmail,
    paymentMethod,
  } = req.body;
  
  const userId = req.user?.id || null; // null for guest bookings
  
  // Normalize contact phone
  const normalizedPhone = normalizePhoneNumber(contactPhone);
  
  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify trip exists and has available seats
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: {
        route: true,
        bus: true,
      },
    });
    
    if (!trip) {
      throw new ApiError('TRIP_NOT_FOUND', 404);
    }
    
    if (trip.status === 'DEPARTED' || trip.status === 'ARRIVED' || trip.status === 'CANCELLED') {
      throw new ApiError('TRIP_DEPARTED', 400);
    }
    
    if (trip.availableSeats < passengers.length) {
      throw new ApiError('BOOKING_SEATS_UNAVAILABLE', 400);
    }
    
    // 2. Verify all seats are available
    const seatIds = passengers.map(p => p.seatId);
    const seats = await tx.seat.findMany({
      where: {
        id: { in: seatIds },
        busId: trip.busId,
      },
      include: {
        passengers: {
          where: {
            booking: {
              tripId: tripId,
              status: { in: ['PENDING', 'CONFIRMED'] },
            },
          },
        },
      },
    });
    
    if (seats.length !== seatIds.length) {
      throw new ApiError('BOOKING_SEATS_UNAVAILABLE', 400);
    }
    
    // Check if any seat is already booked
    const alreadyBooked = seats.some(seat => seat.passengers.length > 0);
    if (alreadyBooked) {
      throw new ApiError('BOOKING_SEATS_UNAVAILABLE', 400);
    }
    
    // 3. Calculate pricing
    const basePrice = trip.currentPrice * passengers.length;
    let luggagePrice = 0;
    let luggageData = null;
    
    if (luggage) {
      const luggageFees = calculateLuggageFees(
        luggage.numberOfBags,
        luggage.estimatedWeight,
        passengers.length
      );
      
      luggagePrice = luggageFees.totalExtraFee;
      luggageData = {
        numberOfBags: luggage.numberOfBags,
        estimatedWeight: luggage.estimatedWeight,
        freeWeightLimit: luggageFees.freeWeightLimit,
        extraFeePerKg: luggageFees.extraFeePerKg,
        totalExtraFee: luggageFees.totalExtraFee,
      };
    }
    
    const totalPrice = basePrice + luggagePrice;
    
    // 4. Generate unique booking code
    let bookingCode;
    let attempts = 0;
    do {
      bookingCode = generateBookingCode();
      const existing = await tx.booking.findUnique({ where: { bookingCode } });
      if (!existing) break;
      attempts++;
    } while (attempts < 10);
    
    if (attempts >= 10) {
      throw new ApiError('SYSTEM_ERROR', 500);
    }
    
    // 5. Create booking
    const booking = await tx.booking.create({
      data: {
        bookingCode,
        userId,
        tripId,
        contactName,
        contactPhone: normalizedPhone,
        contactEmail,
        totalPassengers: passengers.length,
        totalPrice,
        luggagePrice,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'CASH' ? 'RESERVED' : 'PENDING',
        paymentMethod,
        reservedUntil: paymentMethod === 'CASH' 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          : null,
      },
    });
    
    // 6. Create passenger records
    const passengerRecords = await Promise.all(
      passengers.map(p =>
        tx.passenger.create({
          data: {
            bookingId: booking.id,
            seatId: p.seatId,
            fullName: p.fullName,
            age: p.age || null,
            idNumber: p.idNumber || null,
          },
        })
      )
    );
    
    // 7. Create luggage record if applicable
    if (luggageData) {
      await tx.luggage.create({
        data: {
          bookingId: booking.id,
          ...luggageData,
        },
      });
    }
    
    // 8. Update trip available seats
    await tx.trip.update({
      where: { id: tripId },
      data: {
        availableSeats: { decrement: passengers.length },
        status: trip.availableSeats - passengers.length === 0 ? 'FULL' : trip.status,
      },
    });
    
    // Fetch complete booking data for response
    const completeBooking = await tx.booking.findUnique({
      where: { id: booking.id },
      include: {
        trip: {
          include: {
            route: true,
            bus: true,
          },
        },
        passengers: {
          include: {
            seat: true,
          },
        },
        luggage: true,
      },
    });
    
    return completeBooking;
  });
  
  // 9. Send confirmation notification
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const seats = result.passengers.map(p => p.seat.seatNumber).join(', ');
  const route = `${result.trip.route.originCity} → ${result.trip.route.destinationCity}`;
  
  const whatsappMessage = messages.WHATSAPP_BOOKING_CONFIRMATION(
    result.bookingCode,
    route,
    formatDate(result.trip.departureDate),
    result.trip.departureTime,
    seats,
    result.totalPrice
  );
  
  // Send WhatsApp notification (non-blocking)
  sendNotification(normalizedPhone, whatsappMessage, result.id, 'BOOKING_CONFIRMED')
    .catch(err => logger.error('Failed to send booking confirmation:', err));
  
  // Send email if provided (non-blocking)
  if (contactEmail) {
    sendBookingConfirmationEmail(contactEmail, {
      bookingId: result.id,
      contactName,
      bookingCode: result.bookingCode,
      route,
      date: formatDate(result.trip.departureDate),
      time: result.trip.departureTime,
      totalPassengers: result.totalPassengers,
      seats,
      totalPrice: result.totalPrice,
    }).catch(err => logger.error('Failed to send booking email:', err));
  }
  
  logger.info('Booking created:', {
    bookingId: result.id,
    bookingCode: result.bookingCode,
    tripId,
    passengers: result.totalPassengers,
  });
  
  res.status(201).json({
    success: true,
    messageKey: 'BOOKING_CREATED',
    message: getMessage('BOOKING_CREATED'),
    data: {
      booking: {
        id: result.id,
        bookingCode: result.bookingCode,
        status: result.status,
        paymentStatus: result.paymentStatus,
        totalPrice: result.totalPrice,
        luggagePrice: result.luggagePrice,
        reservedUntil: result.reservedUntil,
        trip: {
          id: result.trip.id,
          route: {
            originCity: result.trip.route.originCity,
            destinationCity: result.trip.route.destinationCity,
          },
          departureDate: result.trip.departureDate,
          departureTime: result.trip.departureTime,
          bus: {
            busNumber: result.trip.bus.busNumber,
          },
        },
        passengers: result.passengers.map(p => ({
          fullName: p.fullName,
          seatNumber: p.seat.seatNumber,
        })),
        luggage: result.luggage,
      },
    },
  });
});

/**
 * Get booking by code or ID
 * 
 * GET /api/bookings/:identifier
 */
const getBooking = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  
  // Try to find by booking code first, then by ID
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { bookingCode: identifier.toUpperCase() },
        { id: identifier },
      ],
    },
    include: {
      trip: {
        include: {
          route: true,
          bus: true,
        },
      },
      passengers: {
        include: {
          seat: true,
        },
      },
      luggage: true,
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
  
  if (!booking) {
    throw new ApiError('BOOKING_NOT_FOUND', 404);
  }
  
  res.json({
    success: true,
    data: { booking },
  });
});

/**
 * Get user's bookings
 * 
 * GET /api/bookings/my/list
 */
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { userId: req.user.id },
        { contactPhone: req.user.phoneNumber },
      ],
    },
    include: {
      trip: {
        include: {
          route: true,
          bus: true,
        },
      },
      passengers: {
        include: {
          seat: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  res.json({
    success: true,
    data: { bookings },
  });
});

/**
 * Cancel booking
 * 
 * PUT /api/bookings/:id/cancel
 */
const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const result = await prisma.$transaction(async (tx) => {
    // Get booking
    const booking = await tx.booking.findUnique({
      where: { id },
      include: {
        trip: true,
        passengers: true,
      },
    });
    
    if (!booking) {
      throw new ApiError('BOOKING_NOT_FOUND', 404);
    }
    
    // Check ownership (user's booking or guest with same phone)
    if (req.user && booking.userId !== req.user.id && booking.contactPhone !== req.user.phoneNumber) {
      throw new ApiError('AUTH_FORBIDDEN', 403);
    }
    
    if (booking.status === 'CANCELLED') {
      throw new ApiError('BOOKING_CANCELLED', 400);
    }
    
    // Check if trip has departed
    const now = new Date();
    const departureDateTime = new Date(`${booking.trip.departureDate} ${booking.trip.departureTime}`);
    
    if (now > departureDateTime) {
      throw new ApiError('TRIP_DEPARTED', 400);
    }
    
    // Update booking
    const updatedBooking = await tx.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason || 'Annulé par le client',
      },
    });
    
    // Release seats back to trip
    await tx.trip.update({
      where: { id: booking.tripId },
      data: {
        availableSeats: { increment: booking.totalPassengers },
        status: 'SCHEDULED', // Change from FULL if it was full
      },
    });
    
    return updatedBooking;
  });
  
  logger.info('Booking cancelled:', { bookingId: id, reason });
  
  res.json({
    success: true,
    messageKey: 'BOOKING_CANCELLED',
    message: getMessage('BOOKING_CANCELLED'),
    data: { booking: result },
  });
});

/**
 * Generate ticket (PDF or text)
 * 
 * GET /api/bookings/:id/ticket?format=pdf|text
 */
const getTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { format = 'text' } = req.query;
  
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      trip: {
        include: {
          route: true,
          bus: true,
        },
      },
      passengers: {
        include: {
          seat: true,
        },
      },
      luggage: true,
    },
  });
  
  if (!booking) {
    throw new ApiError('BOOKING_NOT_FOUND', 404);
  }
  
  // Check ownership
  if (req.user && booking.userId !== req.user.id && booking.contactPhone !== req.user.phoneNumber) {
    throw new ApiError('AUTH_FORBIDDEN', 403);
  }
  
  if (format === 'pdf') {
    // Generate PDF ticket
    const ticketsDir = ensureUploadsDir();
    const filename = `ticket-${booking.bookingCode}.pdf`;
    const filepath = path.join(ticketsDir, filename);
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('fr-FR');
    };
    
    const ticketData = {
      bookingCode: booking.bookingCode,
      route: booking.trip.route,
      departureDate: formatDate(booking.trip.departureDate),
      departureTime: booking.trip.departureTime,
      boardingPoint: booking.trip.boardingPoint,
      bus: booking.trip.bus,
      passengers: booking.passengers.map(p => ({
        fullName: p.fullName,
        seatNumber: p.seat.seatNumber,
      })),
      luggage: booking.luggage,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
    };
    
    await generatePDFTicket(ticketData, filepath);
    
    res.download(filepath, filename);
  } else {
    // Generate text ticket
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('fr-FR');
    };
    
    const ticketData = {
      bookingCode: booking.bookingCode,
      route: booking.trip.route,
      departureDate: formatDate(booking.trip.departureDate),
      departureTime: booking.trip.departureTime,
      boardingPoint: booking.trip.boardingPoint,
      bus: booking.trip.bus,
      passengers: booking.passengers.map(p => ({
        fullName: p.fullName,
        seatNumber: p.seat.seatNumber,
      })),
      luggage: booking.luggage,
      totalPrice: booking.totalPrice,
      paymentStatus: booking.paymentStatus,
    };
    
    const textTicket = generateTextTicket(ticketData);
    
    res.json({
      success: true,
      data: {
        ticket: textTicket,
        booking: {
          bookingCode: booking.bookingCode,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        },
      },
    });
  }
});

module.exports = {
  createBooking,
  getBooking,
  getMyBookings,
  cancelBooking,
  getTicket,
};
