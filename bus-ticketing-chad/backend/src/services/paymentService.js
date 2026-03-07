/**
 * Payment Service
 * Handles Mobile Money payments with manual confirmation capability
 * Abstracted to support different MoMo providers in Chad
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const { ApiError } = require('../middlewares/errorHandler');

/**
 * Initialize payment
 * Creates a payment record and returns payment instructions
 * 
 * @param {string} bookingId - Booking ID
 * @param {number} amount - Amount in FCFA
 * @param {string} method - Payment method (MOMO_AIRTEL, MOMO_MOOV, MOMO_TIGO, CASH)
 * @param {string} phoneNumber - Phone number for MoMo
 * @returns {Promise<object>} Payment details
 */
const initiatePayment = async (bookingId, amount, method, phoneNumber = null) => {
  try {
    // Verify booking exists and is not already paid
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    
    if (!booking) {
      throw new ApiError('BOOKING_NOT_FOUND', 404);
    }
    
    if (booking.paymentStatus === 'PAID') {
      throw new ApiError('PAYMENT_ALREADY_PAID', 400);
    }
    
    // Generate transaction reference
    const transactionRef = generateTransactionReference();
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount,
        method,
        phoneNumber,
        status: 'PENDING',
        transactionReference: transactionRef,
      },
    });
    
    // For Mobile Money, return payment instructions
    // In production, this would trigger actual MoMo API calls
    if (method.startsWith('MOMO_')) {
      return {
        paymentId: payment.id,
        transactionReference: transactionRef,
        amount,
        method,
        instructions: getMoMoInstructions(method, phoneNumber, amount, transactionRef),
        status: 'PENDING',
      };
    }
    
    // For cash, mark as reserved
    if (method === 'CASH') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'RESERVED' },
      });
      
      return {
        paymentId: payment.id,
        transactionReference: transactionRef,
        amount,
        method,
        instructions: 'Payez en espèces au guichet avec votre code de réservation.',
        status: 'RESERVED',
      };
    }
    
    return {
      paymentId: payment.id,
      transactionReference: transactionRef,
      amount,
      method,
      status: 'PENDING',
    };
  } catch (error) {
    logger.error('Failed to initiate payment:', error);
    throw error;
  }
};

/**
 * Confirm payment manually (admin action)
 * Critical for Chad context where MoMo confirmations may be manual
 * 
 * @param {string} paymentId - Payment ID
 * @param {string} adminId - Admin user ID who confirmed
 * @returns {Promise<object>} Updated payment and booking
 */
const confirmPayment = async (paymentId, adminId) => {
  try {
    // Get payment with booking
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
      },
    });
    
    if (!payment) {
      throw new ApiError('PAYMENT_NOT_FOUND', 404);
    }
    
    if (payment.status === 'PAID') {
      throw new ApiError('PAYMENT_ALREADY_PAID', 400);
    }
    
    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        confirmedBy: adminId,
        confirmedAt: new Date(),
      },
    });
    
    // Update booking payment status
    const updatedBooking = await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
      },
    });
    
    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'PAYMENT_CONFIRMED',
        entityType: 'Payment',
        entityId: paymentId,
        details: JSON.stringify({
          bookingId: payment.bookingId,
          amount: payment.amount,
          method: payment.method,
        }),
      },
    });
    
    logger.info('Payment confirmed:', {
      paymentId,
      bookingId: payment.bookingId,
      confirmedBy: adminId,
    });
    
    return {
      payment: updatedPayment,
      booking: updatedBooking,
    };
  } catch (error) {
    logger.error('Failed to confirm payment:', error);
    throw error;
  }
};

/**
 * Verify Mobile Money payment
 * In production, this would call actual MoMo API to verify transaction
 * 
 * @param {string} transactionReference - Transaction reference
 * @returns {Promise<object>} Verification result
 */
const verifyMoMoPayment = async (transactionReference) => {
  try {
    // Find payment by transaction reference
    const payment = await prisma.payment.findUnique({
      where: { transactionReference },
      include: {
        booking: true,
      },
    });
    
    if (!payment) {
      throw new ApiError('PAYMENT_NOT_FOUND', 404);
    }
    
    // In production, call MoMo provider API here
    // For now, return pending status
    // Example:
    // const momoResult = await callMoMoAPI(transactionReference);
    // if (momoResult.status === 'SUCCESS') {
    //   return await confirmPayment(payment.id, 'SYSTEM');
    // }
    
    return {
      transactionReference,
      status: payment.status,
      amount: payment.amount,
      message: 'Paiement en attente de confirmation',
    };
  } catch (error) {
    logger.error('Failed to verify MoMo payment:', error);
    throw error;
  }
};

/**
 * Mark payment as failed
 * 
 * @param {string} paymentId - Payment ID
 * @param {string} reason - Failure reason
 * @returns {Promise<object>} Updated payment
 */
const failPayment = async (paymentId, reason) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'FAILED',
        failureReason: reason,
      },
    });
    
    logger.info('Payment marked as failed:', { paymentId, reason });
    
    return payment;
  } catch (error) {
    logger.error('Failed to mark payment as failed:', error);
    throw error;
  }
};

/**
 * Generate unique transaction reference
 */
const generateTransactionReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${random}`.toUpperCase();
};

/**
 * Get Mobile Money payment instructions in French
 * These are provider-specific instructions for Chad
 */
const getMoMoInstructions = (method, phoneNumber, amount, reference) => {
  const instructions = {
    MOMO_AIRTEL: `
💳 *Paiement Airtel Money*

1. Composez *130#
2. Sélectionnez "Payer un commerçant"
3. Entrez le code marchand: XXXX
4. Montant: ${amount} FCFA
5. Référence: ${reference}
6. Confirmez avec votre PIN

Ou appelez le 130 pour assistance.
    `.trim(),
    
    MOMO_MOOV: `
💳 *Paiement Moov Money*

1. Composez *555#
2. Sélectionnez "Paiement"
3. Entrez le code marchand: XXXX
4. Montant: ${amount} FCFA
5. Référence: ${reference}
6. Confirmez avec votre code secret

Ou appelez le 555 pour assistance.
    `.trim(),
    
    MOMO_TIGO: `
💳 *Paiement Tigo Cash*

1. Composez *501#
2. Sélectionnez "Payer"
3. Entrez le code marchand: XXXX
4. Montant: ${amount} FCFA
5. Référence: ${reference}
6. Confirmez avec votre PIN

Ou appelez le 501 pour assistance.
    `.trim(),
  };
  
  return instructions[method] || 'Instructions de paiement non disponibles';
};

/**
 * Process refund
 * 
 * @param {string} paymentId - Payment ID
 * @param {string} adminId - Admin processing refund
 * @param {string} reason - Refund reason
 * @returns {Promise<object>} Refund result
 */
const processRefund = async (paymentId, adminId, reason) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: true,
      },
    });
    
    if (!payment) {
      throw new ApiError('PAYMENT_NOT_FOUND', 404);
    }
    
    if (payment.status !== 'PAID') {
      throw new ApiError('PAYMENT_NOT_PAID', 400);
    }
    
    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        metadata: JSON.stringify({ refundReason: reason }),
      },
    });
    
    // Update booking
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
      },
    });
    
    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'PAYMENT_REFUNDED',
        entityType: 'Payment',
        entityId: paymentId,
        details: JSON.stringify({
          bookingId: payment.bookingId,
          amount: payment.amount,
          reason,
        }),
      },
    });
    
    logger.info('Payment refunded:', { paymentId, reason, adminId });
    
    return updatedPayment;
  } catch (error) {
    logger.error('Failed to process refund:', error);
    throw error;
  }
};

module.exports = {
  initiatePayment,
  confirmPayment,
  verifyMoMoPayment,
  failPayment,
  processRefund,
  generateTransactionReference,
};
