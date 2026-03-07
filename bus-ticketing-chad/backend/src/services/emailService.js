/**
 * Email Service
 * SMTP-based email service as fallback communication channel
 */

const nodemailer = require('nodemailer');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

// Create email transporter
let transporter = null;

try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    // Verify transporter
    transporter.verify((error, success) => {
      if (error) {
        logger.error('Email transporter verification failed:', error);
      } else {
        logger.info('Email service ready');
      }
    });
  } else {
    logger.warn('Email not configured - Email service disabled');
  }
} catch (error) {
  logger.error('Failed to initialize email transporter:', error);
}

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 * @param {string} bookingId - Associated booking ID
 * @param {string} messageKey - Message key for tracking
 * @returns {Promise<object>} Send result
 */
const sendEmail = async (to, subject, text, html = null, bookingId = null, messageKey = 'GENERAL') => {
  try {
    if (!transporter) {
      logger.warn('Email not configured - Email not sent:', { to, subject });
      
      if (bookingId) {
        await logNotification(bookingId, 'EMAIL', to, messageKey, text, 'FAILED', 
          'Email service not configured');
      }
      
      return {
        success: false,
        error: 'Email service not configured',
      };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html: html || text,
    };
    
    const result = await transporter.sendMail(mailOptions);
    
    logger.info('Email sent:', { to, subject, messageId: result.messageId });
    
    if (bookingId) {
      await logNotification(bookingId, 'EMAIL', to, messageKey, text, 'SENT', null, result.messageId);
    }
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    logger.error('Failed to send email:', error);
    
    if (bookingId) {
      await logNotification(bookingId, 'EMAIL', to, messageKey, text, 'FAILED', error.message);
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send booking confirmation email
 */
const sendBookingConfirmationEmail = async (to, bookingDetails) => {
  const subject = 'Confirmation de réservation - Chad Bus';
  
  const text = `
Bonjour ${bookingDetails.contactName},

Votre réservation a été confirmée avec succès.

Code de réservation: ${bookingDetails.bookingCode}
Trajet: ${bookingDetails.route}
Date: ${bookingDetails.date}
Heure: ${bookingDetails.time}
Nombre de passagers: ${bookingDetails.totalPassengers}
Places: ${bookingDetails.seats}
Montant total: ${bookingDetails.totalPrice} FCFA

Présentez ce code au guichet pour obtenir votre billet.

Merci d'avoir choisi Chad Bus.
  `.trim();
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">🎫 Confirmation de réservation</h2>
      <p>Bonjour <strong>${bookingDetails.contactName}</strong>,</p>
      <p>Votre réservation a été confirmée avec succès.</p>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Code de réservation:</strong> ${bookingDetails.bookingCode}</p>
        <p><strong>Trajet:</strong> ${bookingDetails.route}</p>
        <p><strong>Date:</strong> ${bookingDetails.date}</p>
        <p><strong>Heure:</strong> ${bookingDetails.time}</p>
        <p><strong>Nombre de passagers:</strong> ${bookingDetails.totalPassengers}</p>
        <p><strong>Places:</strong> ${bookingDetails.seats}</p>
        <p><strong>Montant total:</strong> ${bookingDetails.totalPrice} FCFA</p>
      </div>
      
      <p>Présentez ce code au guichet pour obtenir votre billet.</p>
      <p>Merci d'avoir choisi Chad Bus.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html, bookingDetails.bookingId, 'BOOKING_CONFIRMED');
};

/**
 * Send payment confirmation email
 */
const sendPaymentConfirmationEmail = async (to, paymentDetails) => {
  const subject = 'Confirmation de paiement - Chad Bus';
  
  const text = `
Bonjour,

Votre paiement a été confirmé avec succès.

Code de réservation: ${paymentDetails.bookingCode}
Montant: ${paymentDetails.amount} FCFA
Méthode: ${paymentDetails.method}

Votre billet est prêt. Bon voyage!

Merci d'avoir choisi Chad Bus.
  `.trim();
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #16a34a;">✅ Paiement confirmé</h2>
      <p>Bonjour,</p>
      <p>Votre paiement a été confirmé avec succès.</p>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Code de réservation:</strong> ${paymentDetails.bookingCode}</p>
        <p><strong>Montant:</strong> ${paymentDetails.amount} FCFA</p>
        <p><strong>Méthode:</strong> ${paymentDetails.method}</p>
      </div>
      
      <p>Votre billet est prêt. Bon voyage!</p>
      <p>Merci d'avoir choisi Chad Bus.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html, paymentDetails.bookingId, 'PAYMENT_CONFIRMED');
};

/**
 * Log notification in database
 */
const logNotification = async (
  bookingId,
  channel,
  recipient,
  messageKey,
  content,
  status,
  errorMessage = null,
  externalId = null
) => {
  try {
    await prisma.notification.create({
      data: {
        bookingId,
        channel,
        recipient,
        messageKey,
        content,
        status,
        errorMessage,
        sentAt: status === 'SENT' ? new Date() : null,
      },
    });
  } catch (error) {
    logger.error('Failed to log notification:', error);
  }
};

module.exports = {
  sendEmail,
  sendBookingConfirmationEmail,
  sendPaymentConfirmationEmail,
};
