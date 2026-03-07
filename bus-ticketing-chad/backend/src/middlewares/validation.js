/**
 * Validation Middleware
 * Request validation using express-validator with French error messages
 */

const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');
const { getMessage } = require('../config/messages');

/**
 * Validate request and return errors in French
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    
    throw new ApiError('VALIDATION_ERROR', 400, errorMessages);
  }
  
  next();
};

/**
 * Chad phone number validation
 * Format: +235 XX XX XX XX or 235XXXXXXXX or just local number
 */
const isValidChadPhoneNumber = (phone) => {
  // Remove spaces and special characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it matches Chad phone patterns
  // Chad country code: +235
  // Local numbers: 8 digits starting with 6, 7, 9, or 2
  const patterns = [
    /^\+?235[6792]\d{7}$/, // International format
    /^[6792]\d{7}$/,        // Local format (8 digits)
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

/**
 * Normalize Chad phone number to international format
 */
const normalizePhoneNumber = (phone) => {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // If already has country code
  if (cleaned.startsWith('+235')) {
    return cleaned;
  }
  
  if (cleaned.startsWith('235')) {
    return '+' + cleaned;
  }
  
  // Add Chad country code
  if (/^[6792]\d{7}$/.test(cleaned)) {
    return '+235' + cleaned;
  }
  
  return phone; // Return as-is if format unknown
};

/**
 * Date validation helper
 */
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Future date validation
 */
const isFutureDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

/**
 * Validate time format (HH:mm)
 */
const isValidTime = (timeString) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeString);
};

module.exports = {
  validate,
  isValidChadPhoneNumber,
  normalizePhoneNumber,
  isValidDate,
  isFutureDate,
  isValidTime,
};
