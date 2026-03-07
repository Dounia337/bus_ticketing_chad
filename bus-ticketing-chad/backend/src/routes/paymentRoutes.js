const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { validate } = require('../middlewares/validation');
const { asyncHandler } = require('../middlewares/errorHandler');
const paymentService = require('../services/paymentService');

router.post('/:bookingId/initiate', [
  body('method').isIn(['MOMO_AIRTEL', 'MOMO_MOOV', 'MOMO_TIGO', 'CASH']),
  body('phoneNumber').optional(),
], validate, asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { amount, method, phoneNumber } = req.body;
  const result = await paymentService.initiatePayment(bookingId, amount, method, phoneNumber);
  res.json({ success: true, data: result });
}));

router.get('/:transactionRef/verify', asyncHandler(async (req, res) => {
  const { transactionRef } = req.params;
  const result = await paymentService.verifyMoMoPayment(transactionRef);
  res.json({ success: true, data: result });
}));

module.exports = router;
