/**
 * Authentication Middleware
 * JWT-based auth with phone number OTP verification
 */

const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Generate JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError('AUTH_TOKEN_INVALID', 401);
  }
};

/**
 * Authentication middleware
 * Extracts and verifies JWT from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('AUTH_UNAUTHORIZED', 401);
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    
    if (!user || !user.isActive) {
      throw new ApiError('AUTH_UNAUTHORIZED', 401);
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('AUTH_UNAUTHORIZED', 401));
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError('AUTH_FORBIDDEN', 403));
    }
    
    next();
  };
};

/**
 * Generate random OTP
 */
const generateOTP = () => {
  const length = parseInt(process.env.OTP_LENGTH) || 6;
  const otp = Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
  return otp;
};

/**
 * Calculate OTP expiration time
 */
const getOTPExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Verify OTP
 */
const verifyOTP = async (phoneNumber, otp) => {
  const user = await prisma.user.findUnique({
    where: { phoneNumber },
  });
  
  if (!user) {
    throw new ApiError('USER_NOT_FOUND', 404);
  }
  
  if (!user.lastOtp || !user.otpExpiresAt) {
    throw new ApiError('AUTH_OTP_INVALID', 400);
  }
  
  if (new Date() > user.otpExpiresAt) {
    throw new ApiError('AUTH_OTP_INVALID', 400);
  }
  
  if (user.lastOtp !== otp) {
    throw new ApiError('AUTH_OTP_INVALID', 400);
  }
  
  // Clear OTP after successful verification
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastOtp: null,
      otpExpiresAt: null,
    },
  });
  
  return user;
};

/**
 * Optional authentication
 * Authenticates if token is present, but doesn't require it
 * Useful for guest bookings
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    
    req.user = user && user.isActive ? user : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  optionalAuth,
  generateOTP,
  getOTPExpiry,
  verifyOTP,
};
