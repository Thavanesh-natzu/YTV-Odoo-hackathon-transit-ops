/**
 * trip.controller.js
 * Implements the Trip APIs defined in API_SPEC.md:
 *   GET    /trips
 *   GET    /trips/:id
 *   POST   /trips
 *   PATCH  /trips/:id/dispatch
 *   PATCH  /trips/:id/complete
 *   PATCH  /trips/:id/cancel
 *
 * Response envelope matches API_SPEC.md's Standard Success/Error Response.
 */

const Trip = require('../models/Trip');
const { validateTripCreation, validateTripCompletion } = require('../utils/validators');
const statusRules = require('../utils/statusRules');

function success(res, status, message, data = {}) {
  return res.status(status).json({ success: true, message, data });
}

function failure(res, status, message, errors = []) {
  return res.status(status).json({ success: false, message, errors });
}

exports.getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.findAll();
    return success(res, 200, 'Trips retrieved successfully.', trips);
  } catch (err) {
    return failure(res, 500, 'Failed to retrieve trips.', [err.message]);
  }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return failure(res, 404, 'Trip not found.');
    return success(res, 200, 'Trip retrieved successfully.', trip);
  } catch (err) {
    return failure(res, 500, 'Failed to retrieve trip.', [err.message]);
  }
};

exports.createTrip = async (req, res) => {
  try {
    const errors = validateTripCreation(req.body);
    if (errors.length) return failure(res, 400, 'Validation failed.', errors);

    const trip = await Trip.create(req.body);
    return success(res, 201, 'Trip created successfully.', trip);
  } catch (err) {
    return failure(res, 500, 'Failed to create trip.', [err.message]);
  }
};

exports.dispatchTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return failure(res, 404, 'Trip not found.');

    if (!statusRules.canDispatch(trip)) {
      return failure(res, 409, 'Only Draft trips can be dispatched.');
    }

    const eligibility = await statusRules.assertDispatchEligibility(trip);
    if (!eligibility.valid) {
      return failure(res, 400, 'Dispatch validation failed.', eligibility.errors);
    }

    const updatedTrip = await Trip.updateStatus(trip.trip_id, statusRules.TRIP_STATUS.DISPATCHED);
    await statusRules.applyDispatchTransition(trip);

    return success(res, 200, 'Trip dispatched successfully.', updatedTrip);
  } catch (err) {
    return failure(res, 500, 'Failed to dispatch trip.', [err.message]);
  }
};

exports.completeTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return failure(res, 404, 'Trip not found.');

    if (!statusRules.canComplete(trip)) {
      return failure(res, 409, 'Only Dispatched trips can be completed.');
    }

    const errors = validateTripCompletion(req.body);
    if (errors.length) return failure(res, 400, 'Validation failed.', errors);

    const updatedTrip = await Trip.updateStatus(trip.trip_id, statusRules.TRIP_STATUS.COMPLETED, {
      actual_distance: req.body.actual_distance,
      revenue: req.body.revenue,
    });
    await statusRules.applyCompleteTransition(trip);

    return success(res, 200, 'Trip completed successfully.', updatedTrip);
  } catch (err) {
    return failure(res, 500, 'Failed to complete trip.', [err.message]);
  }
};

exports.cancelTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return failure(res, 404, 'Trip not found.');

    if (!statusRules.canCancel(trip)) {
      return failure(res, 409, 'Only Draft or Dispatched trips can be cancelled.');
    }

    const updatedTrip = await Trip.updateStatus(trip.trip_id, statusRules.TRIP_STATUS.CANCELLED);
    await statusRules.applyCancelTransition(trip);

    return success(res, 200, 'Trip cancelled successfully.', updatedTrip);
  } catch (err) {
    return failure(res, 500, 'Failed to cancel trip.', [err.message]);
  }
};
