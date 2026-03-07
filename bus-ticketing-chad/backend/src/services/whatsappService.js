/**
 * WhatsApp Service
 * Handles WhatsApp notifications via Twilio WhatsApp Business API
 * Primary communication channel for Chad users
 */

const twilio = require('twilio');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

// Initialize Twilio client
let twilioClient = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } else {
    logger.warn('Twilio credentials not configured - WhatsApp disabled');
  }
} catch (error) {
  logger.error('Failed to initialize Twilio client:', error);
}

/**
 * Send WhatsApp message
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} message - Message content in French
 * @param {string} bookingId - Associated booking ID for logging
 * @param {string} messageKey - Message key for tracking
 * @returns {Promise<object>} Send result
 */
const sendWhatsAppMessage = async (to, message, bookingId = null, messageKey = 'GENERAL') => {
  try {
    // If Twilio not configured, log and return mock success
    if (!twilioClient) {
      logger.warn('WhatsApp not configured - Message not sent:', { to, messageKey });
      
      // Still log the notification attempt
      if (bookingId) {
        await logNotification(bookingId, 'WHATSAPP', to, messageKey, message, 'FAILED', 
          'Twilio not configured');
      }
      
      return {
        success: false,
        error: 'WhatsApp service not configured',
      };
    }
    
    // Format phone number for WhatsApp
    const whatsappNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    // Send message
    const result = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: whatsappNumber,
      body: message,
    });
    
    logger.info('WhatsApp message sent:', { to, sid: result.sid, status: result.status });
    
    // Log successful notification
    if (bookingId) {
      await logNotification(bookingId, 'WHATSAPP', to, messageKey, message, 'SENT', null, result.sid);
    }
    
    return {
      success: true,
      sid: result.sid,
      status: result.status,
    };
  } catch (error) {
    logger.error('Failed to send WhatsApp message:', error);
    
    // Log failed notification
    if (bookingId) {
      await logNotification(bookingId, 'WHATSAPP', to, messageKey, message, 'FAILED', error.message);
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send SMS fallback if WhatsApp fails
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @param {string} bookingId - Associated booking ID
 * @param {string} messageKey - Message key
 * @returns {Promise<object>} Send result
 */
const sendSMS = async (to, message, bookingId = null, messageKey = 'GENERAL') => {
  try {
    if (!twilioClient) {
      logger.warn('Twilio not configured - SMS not sent:', { to, messageKey });
      
      if (bookingId) {
        await logNotification(bookingId, 'SMS', to, messageKey, message, 'FAILED', 
          'Twilio not configured');
      }
      
      return {
        success: false,
        error: 'SMS service not configured',
      };
    }
    
    const result = await twilioClient.messages.create({
      from: process.env.TWILIO_SMS_NUMBER,
      to: to,
      body: message,
    });
    
    logger.info('SMS sent:', { to, sid: result.sid, status: result.status });
    
    if (bookingId) {
      await logNotification(bookingId, 'SMS', to, messageKey, message, 'SENT', null, result.sid);
    }
    
    return {
      success: true,
      sid: result.sid,
      status: result.status,
    };
  } catch (error) {
    logger.error('Failed to send SMS:', error);
    
    if (bookingId) {
      await logNotification(bookingId, 'SMS', to, messageKey, message, 'FAILED', error.message);
    }
    
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send notification with WhatsApp primary, SMS fallback
 * Critical for Chad's mobile-first context
 */
const sendNotification = async (phoneNumber, message, bookingId = null, messageKey = 'GENERAL') => {
  // Try WhatsApp first
  const whatsappResult = await sendWhatsAppMessage(phoneNumber, message, bookingId, messageKey);
  
  if (whatsappResult.success) {
    return whatsappResult;
  }
  
  // Fallback to SMS
  logger.info('WhatsApp failed, trying SMS fallback');
  return await sendSMS(phoneNumber, message, bookingId, messageKey);
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
  sendWhatsAppMessage,
  sendSMS,
  sendNotification,
};
