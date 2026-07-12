/**
 * maintenanceService.js
 * Frontend API communication layer for the Maintenance endpoints (API_SPEC.md).
 * Uses the shared Axios instance from services/api.js.
 */

import api from './api';

const maintenanceService = {
  getAllMaintenance: () => api.get('/maintenance'),
  createMaintenance: (payload) => api.post('/maintenance', payload),
  closeMaintenance: (id, payload = {}) => api.patch(`/maintenance/${id}/close`, payload),
};

export default maintenanceService;
