/**
 * Authentication Routes
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, isValidChadPhoneNumber } = require('../middlewares/validation');
const { authenticate } = require('../middlewares/auth');

// Request OTP
router.post(
  '/request-otp',
  [
    body('phoneNumber')
      .trim()
      .custom(isValidChadPhoneNumber)
      .withMessage('Numéro de téléphone invalide'),
  ],
  validate,
  authController.requestOTP
);

// Verify OTP and login
router.post(
  '/verify-otp',
  [
    body('phoneNumber')
      .trim()
      .custom(isValidChadPhoneNumber)
      .withMessage('Numéro de téléphone invalide'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('Le code OTP doit contenir 6 chiffres'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Le nom complet est requis'),
  ],
  validate,
  authController.verifyOTPAndLogin
);

// Register with password (optional flow)
router.post(
  '/register',
  [
    body('fullName')
      .trim()
      .isLength({ min: 2 })
      .withMessage('Le nom complet est requis'),
    body('phoneNumber')
      .trim()
      .custom(isValidChadPhoneNumber)
      .withMessage('Numéro de téléphone invalide'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email invalide'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  ],
  validate,
  authController.register
);

// Login with password (optional flow)
router.post(
  '/login',
  [
    body('phoneNumber')
      .trim()
      .custom(isValidChadPhoneNumber)
      .withMessage('Numéro de téléphone invalide'),
    body('password')
      .notEmpty()
      .withMessage('Le mot de passe est requis'),
  ],
  validate,
  authController.login
);

// Get current user profile (protected)
router.get('/me', authenticate, authController.getProfile);

// Update profile (protected)
router.put(
  '/profile',
  authenticate,
  [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Le nom complet doit contenir au moins 2 caractères'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email invalide'),
  ],
  validate,
  authController.updateProfile
);

module.exports = router;
