/**
 * tripService.js
 * Frontend API communication layer for the Trip endpoints (API_SPEC.md).
 * Uses the shared Axios instance from services/api.js.
 */

import api from './api';

const tripService = {
  getAllTrips: () => api.get('/trips'),
  getTripById: (id) => api.get(`/trips/${id}`),
  createTrip: (payload) => api.post('/trips', payload),
  dispatchTrip: (id) => api.patch(`/trips/${id}/dispatch`),
  completeTrip: (id, payload = {}) => api.patch(`/trips/${id}/complete`, payload),
  cancelTrip: (id) => api.patch(`/trips/${id}/cancel`),
};

export default tripService;
