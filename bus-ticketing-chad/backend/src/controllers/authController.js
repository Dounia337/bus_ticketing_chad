/**
 * Authentication Controller
 * Handles user registration, OTP verification, and login
 */

const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { 
  generateToken, 
  generateOTP, 
  getOTPExpiry,
  verifyOTP 
} = require('../middlewares/auth');
const { normalizePhoneNumber } = require('../middlewares/validation');
const { ApiError, asyncHandler } = require('../middlewares/errorHandler');
const { getMessage } = require('../config/messages');
const { sendNotification } = require('../services/whatsappService');
const logger = require('../utils/logger');

/**
 * Request OTP for phone number
 * Used for both registration and login
 * 
 * POST /api/auth/request-otp
 * Body: { phoneNumber }
 */
const requestOTP = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  
  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  // Generate OTP
  const otp = generateOTP();
  const otpExpiry = getOTPExpiry();
  
  // Find or create user
  let user = await prisma.user.findUnique({
    where: { phoneNumber: normalizedPhone },
  });
  
  if (!user) {
    // Create guest user for OTP verification
    user = await prisma.user.create({
      data: {
        phoneNumber: normalizedPhone,
        fullName: 'Utilisateur', // Will be updated after OTP verification
        lastOtp: otp,
        otpExpiresAt: otpExpiry,
      },
    });
    
    logger.info('New user created for OTP:', { phoneNumber: normalizedPhone });
  } else {
    // Update existing user with new OTP
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastOtp: otp,
        otpExpiresAt: otpExpiry,
      },
    });
  }
  
  // Send OTP via WhatsApp/SMS
  const message = `Votre code de vérification Chad Bus: ${otp}\n\nCe code expire dans ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;
  
  await sendNotification(normalizedPhone, message, null, 'AUTH_OTP_SENT');
  
  logger.info('OTP sent:', { phoneNumber: normalizedPhone, otp });
  
  res.json({
    success: true,
    messageKey: 'AUTH_OTP_SENT',
    message: getMessage('AUTH_OTP_SENT'),
    data: {
      phoneNumber: normalizedPhone,
      expiresIn: process.env.OTP_EXPIRY_MINUTES || 10,
    },
  });
});

/**
 * Verify OTP and complete registration/login
 * 
 * POST /api/auth/verify-otp
 * Body: { phoneNumber, otp, fullName? }
 */
const verifyOTPAndLogin = asyncHandler(async (req, res) => {
  const { phoneNumber, otp, fullName } = req.body;
  
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  // Verify OTP
  const user = await verifyOTP(normalizedPhone, otp);
  
  // Update full name if provided (for new users)
  let updatedUser = user;
  if (fullName && user.fullName === 'Utilisateur') {
    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { fullName },
    });
  }
  
  // Generate JWT token
  const token = generateToken(updatedUser.id, updatedUser.role);
  
  logger.info('User logged in:', { userId: updatedUser.id, phoneNumber: normalizedPhone });
  
  res.json({
    success: true,
    messageKey: 'AUTH_SUCCESS',
    message: getMessage('AUTH_SUCCESS'),
    data: {
      token,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        phoneNumber: updatedUser.phoneNumber,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    },
  });
});

/**
 * Register new user with password (optional flow)
 * 
 * POST /api/auth/register
 * Body: { fullName, phoneNumber, email?, password }
 */
const register = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber, email, password } = req.body;
  
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { phoneNumber: normalizedPhone },
  });
  
  if (existingUser && existingUser.password) {
    throw new ApiError('USER_ALREADY_EXISTS', 400);
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create or update user
  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          fullName,
          email,
          password: hashedPassword,
        },
      })
    : await prisma.user.create({
        data: {
          fullName,
          phoneNumber: normalizedPhone,
          email,
          password: hashedPassword,
        },
      });
  
  // Generate token
  const token = generateToken(user.id, user.role);
  
  logger.info('User registered:', { userId: user.id, phoneNumber: normalizedPhone });
  
  res.status(201).json({
    success: true,
    messageKey: 'USER_CREATED',
    message: getMessage('USER_CREATED'),
    data: {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
      },
    },
  });
});

/**
 * Login with password (optional flow)
 * 
 * POST /api/auth/login
 * Body: { phoneNumber, password }
 */
const login = asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;
  
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { phoneNumber: normalizedPhone },
  });
  
  if (!user || !user.password) {
    throw new ApiError('AUTH_FAILED', 401);
  }
  
  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new ApiError('AUTH_FAILED', 401);
  }
  
  if (!user.isActive) {
    throw new ApiError('AUTH_FORBIDDEN', 403);
  }
  
  // Generate token
  const token = generateToken(user.id, user.role);
  
  logger.info('User logged in with password:', { userId: user.id });
  
  res.json({
    success: true,
    messageKey: 'AUTH_SUCCESS',
    message: getMessage('AUTH_SUCCESS'),
    data: {
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
      },
    },
  });
});

/**
 * Get current user profile
 * 
 * GET /api/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  
  res.json({
    success: true,
    data: { user },
  });
});

/**
 * Update user profile
 * 
 * PUT /api/auth/profile
 * Body: { fullName?, email? }
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(fullName && { fullName }),
      ...(email && { email }),
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      email: true,
      role: true,
    },
  });
  
  res.json({
    success: true,
    messageKey: 'USER_UPDATED',
    message: getMessage('USER_UPDATED'),
    data: { user },
  });
});

module.exports = {
  requestOTP,
  verifyOTPAndLogin,
  register,
  login,
  getProfile,
  updateProfile,
};
