const { validationResult } = require('express-validator');
const { formatResponse } = require('../services/messageService');

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    
    return res.status(400).json({
      messageKey: 'VALIDATION_ERROR',
      message: firstError.msg,
      errors: errors.array(),
    });
  }
  
  next();
};

module.exports = { validate };
