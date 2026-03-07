const { PrismaClient } = require('@prisma/client');
const { formatResponse } = require('../services/messageService');
const paymentService = require('../services/paymentService');
const whatsappService = require('../services/whatsappService');
const emailService = require('../services/emailService');

const prisma = new PrismaClient();

/**
 * Payment Controller
 * Handles payment processing and confirmation
 */

/**
 * Check payment status
 * GET /api/payments/:bookingId/status
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            trip: {
              include: {
                route: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json(
        formatResponse('PAYMENT_NOT_FOUND')
      );
    }

    // If payment has transaction reference, check status with provider
    if (payment.transactionReference && payment.status === 'PENDING') {
      const statusResult = await paymentService.checkPaymentStatus(
        payment.transactionReference
      );

      // Update if status changed
      if (statusResult.success && statusResult.status !== payment.status) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: statusResult.status },
        });

        if (statusResult.status === 'PAID') {
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
            },
          });

          // Send confirmation notifications
          await sendPaymentConfirmationNotifications(payment.booking);
        }
      }
    }

    res.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        method: payment.method,
        transactionReference: payment.transactionReference,
        createdAt: payment.createdAt,
      },
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json(
      formatResponse('SERVER_ERROR')
    );
  }
};

/**
 * Manually confirm payment (Admin only)
 * POST /api/payments/:bookingId/confirm
 * 
 * This is crucial for Chad where admin may need to manually verify payment
 * when internet is unstable or customer pays via alternative means
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const adminId = req.user.id;

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            trip: {
              include: {
                route: true,
              },
            },
            passengers: {
              include: {
                seat: true,
              },
            },
            luggage: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json(
        formatResponse('PAYMENT_NOT_FOUND')
      );
    }

    if (payment.status === 'PAID') {
      return res.status(400).json(
        formatResponse('PAYMENT_ALREADY_CONFIRMED')
      );
    }

    // Use payment service to confirm
    const result = await paymentService.manuallyConfirmPayment(payment.id, adminId);

    // Send confirmation notifications
    await sendPaymentConfirmationNotifications(result.booking);

    res.json(
      formatResponse('PAYMENT_CONFIRMED', {
        payment: result.payment,
        booking: result.booking,
      })
    );

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json(
      formatResponse('SERVER_ERROR', {
        error: error.message,
      })
    );
  }
};

/**
 * Process payment callback from Mobile Money provider
 * POST /api/payments/callback
 * 
 * This webhook receives notifications from Mobile Money provider
 */
exports.paymentCallback = async (req, res) => {
  try {
    // Validate webhook signature (in production)
    // const signature = req.headers['x-provider-signature'];
    // if (!validateSignature(signature, req.body)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    const callbackData = req.body;
    
    const result = await paymentService.processPaymentCallback(callbackData);

    if (result.success && callbackData.status === 'SUCCESS') {
      // Fetch complete booking details
      const booking = await prisma.booking.findUnique({
        where: { id: result.payment.bookingId },
        include: {
          trip: {
            include: {
              route: true,
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

      // Send confirmation notifications
      await sendPaymentConfirmationNotifications(booking);
    }

    // Always respond 200 OK to webhook
    res.json({ success: true });

  } catch (error) {
    console.error('Payment callback error:', error);
    // Still respond 200 OK to prevent retries
    res.json({ success: false, error: error.message });
  }
};

/**
 * Initiate new payment for existing booking
 * POST /api/payments/:bookingId/initiate
 * 
 * For bookings that were reserved with "pay later" option
 */
exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, phoneNumber } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
      },
    });

    if (!booking) {
      return res.status(404).json(
        formatResponse('BOOKING_NOT_FOUND')
      );
    }

    if (booking.payment.status === 'PAID') {
      return res.status(400).json(
        formatResponse('PAYMENT_ALREADY_CONFIRMED')
      );
    }

    // Update payment method if provided
    if (paymentMethod) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          method: paymentMethod,
          phoneNumber: phoneNumber || booking.payment.phoneNumber,
        },
      });
    }

    // Initiate Mobile Money payment
    if (paymentMethod === 'MOMO') {
      const paymentResult = await paymentService.initiateMoMoPayment({
        phoneNumber: phoneNumber || booking.payment.phoneNumber,
        amount: booking.totalPrice,
        bookingId: booking.id,
      });

      if (paymentResult.success) {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: {
            transactionReference: paymentResult.transactionReference,
            status: 'PENDING',
          },
        });

        return res.json(
          formatResponse('PAYMENT_INITIATED', {
            transactionReference: paymentResult.transactionReference,
            message: 'Vérifiez votre téléphone pour confirmer le paiement',
          })
        );
      } else {
        return res.status(500).json(
          formatResponse('PAYMENT_FAILED', {
            error: paymentResult.error,
          })
        );
      }
    }

    res.json(
      formatResponse('PAYMENT_INITIATED')
    );

  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json(
      formatResponse('SERVER_ERROR')
    );
  }
};

/**
 * Helper: Send payment confirmation notifications
 */
async function sendPaymentConfirmationNotifications(booking) {
  try {
    // Send WhatsApp notification
    await whatsappService.sendPaymentConfirmation(
      booking,
      booking.payment || { amount: booking.totalPrice },
      booking.trip,
      booking.trip.route
    );

    // Send email notification
    if (booking.guestEmail || booking.user?.email) {
      await emailService.sendPaymentConfirmation(
        booking,
        booking.payment || { amount: booking.totalPrice },
        booking.trip,
        booking.trip.route
      );
    }
  } catch (error) {
    console.error('Error sending payment notifications:', error);
  }
}

module.exports = exports;
