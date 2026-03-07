/**
 * Error Handling Middleware
 * Centralized error handling with French error messages
 */

const logger = require('../utils/logger');
const { getMessage } = require('../config/messages');

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(messageKey, statusCode = 500, details = null) {
    super(getMessage(messageKey));
    this.messageKey = messageKey;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError('SYSTEM_ERROR', 404);
  error.message = `Route non trouvée: ${req.originalUrl}`;
  next(error);
};

/**
 * Global Error Handler
 * Returns French error messages to client
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, messageKey, message, details } = err;
  
  // Default to 500 if status code not set
  statusCode = statusCode || 500;
  
  // Log error for debugging
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      url: req.originalUrl,
      statusCode,
    });
  }
  
  // Prepare error response
  const errorResponse = {
    success: false,
    messageKey: messageKey || 'SYSTEM_ERROR',
    message: message || getMessage('SYSTEM_ERROR'),
  };
  
  // Add details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = details;
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper to catch promise rejections
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
};
