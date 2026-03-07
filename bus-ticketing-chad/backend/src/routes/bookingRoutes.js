const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { validate } = require('../middlewares/validation');
const { optionalAuth, authenticate } = require('../middlewares/auth');

router.post('/', optionalAuth, [
  body('tripId').isUUID().withMessage('ID de voyage invalide'),
  body('passengers').isArray({ min: 1 }).withMessage('Au moins un passager requis'),
  body('contactName').trim().notEmpty().withMessage('Nom de contact requis'),
  body('contactPhone').trim().notEmpty().withMessage('Téléphone requis'),
], validate, bookingController.createBooking);

router.get('/my/list', authenticate, bookingController.getMyBookings);
router.get('/:identifier', optionalAuth, bookingController.getBooking);
router.put('/:id/cancel', optionalAuth, bookingController.cancelBooking);
router.get('/:id/ticket', optionalAuth, bookingController.getTicket);

module.exports = router;
