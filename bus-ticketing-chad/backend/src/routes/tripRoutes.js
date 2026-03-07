const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

router.get('/search', tripController.searchTrips);
router.get('/routes/available', tripController.getAvailableRoutes);
router.get('/cities', tripController.getCities);
router.get('/:id', tripController.getTripDetails);

module.exports = router;
