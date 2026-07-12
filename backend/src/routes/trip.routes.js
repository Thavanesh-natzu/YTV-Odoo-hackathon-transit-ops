/**
 * trip.routes.js
 * Maps the Trip API endpoints (API_SPEC.md) to trip.controller.js.
 * All routes require authentication per API_SPEC.md's API Rules
 * ("All APIs except /auth/login require authentication.").
 */

const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const authenticate = require('../middleware/auth.middleware');

router.get('/', authenticate, tripController.getAllTrips);
router.get('/:id', authenticate, tripController.getTripById);
router.post('/', authenticate, tripController.createTrip);
router.patch('/:id/dispatch', authenticate, tripController.dispatchTrip);
router.patch('/:id/complete', authenticate, tripController.completeTrip);
router.patch('/:id/cancel', authenticate, tripController.cancelTrip);

module.exports = router;
