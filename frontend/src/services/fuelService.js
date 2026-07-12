/**
 * fuelService.js
 * ---------------------------------------------------------------------------
 * Frontend API communication layer for Fuel and Dashboard endpoints.
 * Per PROJECT_STRUCTURE.md, services/ contains the Axios configuration and
 * API communication layer; this file consumes the shared Axios instance
 * (`api.js`) rather than configuring its own, since api.js is a shared file
 * per TEAM_ASSIGNMENTS.md.
 *
 * Endpoints used (API_SPEC.md):
 *   GET  /fuel
 *   POST /fuel
 *   GET  /dashboard
 *
 * Per API_SPEC.md -> API Rules: "Frontend must never modify status values
 * directly" and "Business validations are performed in the backend only."
 * This service performs no business logic — it only forwards requests and
 * returns response data (or throws standardized errors) for the UI layer.
 * ---------------------------------------------------------------------------
 */

import api from "./api";

/**
 * Fetches fuel logs, optionally filtered by vehicle, trip, or date range.
 * @param {Object} [filters]
 * @param {number} [filters.vehicle_id]
 * @param {number} [filters.trip_id]
 * @param {string} [filters.start_date] - YYYY-MM-DD
 * @param {string} [filters.end_date]   - YYYY-MM-DD
 * @returns {Promise<Array>} array of fuel log records
 */
export async function getFuelLogs(filters = {}) {
  try {
    const params = {};
    if (filters.vehicle_id) params.vehicle_id = filters.vehicle_id;
    if (filters.trip_id) params.trip_id = filters.trip_id;
    if (filters.start_date) params.start_date = filters.start_date;
    if (filters.end_date) params.end_date = filters.end_date;

    const response = await api.get("/fuel", { params });
    return response.data.data.fuelLogs;
  } catch (error) {
    throw normalizeError(error, "Failed to fetch fuel logs");
  }
}

/**
 * Creates a new fuel log entry.
 * @param {Object} fuelLog
 * @param {number} fuelLog.vehicle_id
 * @param {number} [fuelLog.trip_id]
 * @param {number} fuelLog.liters
 * @param {number} fuelLog.cost
 * @param {string} fuelLog.date - YYYY-MM-DD
 * @returns {Promise<Object>} the created fuel log record
 */
export async function addFuelLog(fuelLog) {
  try {
    // Basic input validation only (BUSINESS_RULES.md -> "Frontend performs
    // only basic input validation"). The backend remains the source of
    // truth and re-validates everything server-side.
    const payload = {
      vehicle_id: Number(fuelLog.vehicle_id),
      trip_id: fuelLog.trip_id ? Number(fuelLog.trip_id) : null,
      liters: Number(fuelLog.liters),
      cost: Number(fuelLog.cost),
      date: fuelLog.date,
    };

    const response = await api.post("/fuel", payload);
    return response.data.data.fuelLog;
  } catch (error) {
    throw normalizeError(error, "Failed to add fuel log");
  }
}

/**
 * Fetches fleet-wide dashboard KPIs.
 * @returns {Promise<Object>} dashboard metrics object
 */
export async function getDashboardMetrics() {
  try {
    const response = await api.get("/dashboard");
    return response.data.data;
  } catch (error) {
    throw normalizeError(error, "Failed to fetch dashboard metrics");
  }
}

/**
 * Normalizes Axios errors into a consistent shape for UI consumption,
 * preferring the backend's standard error envelope (API_SPEC.md) when
 * available.
 * @param {import('axios').AxiosError} error
 * @param {string} fallbackMessage
 * @returns {Error & { errors?: string[] }}
 */
function normalizeError(error, fallbackMessage) {
  const backendPayload = error?.response?.data;

  // No response at all usually means a network/connectivity failure rather
  // than a validation error from the backend — worth surfacing distinctly.
  const message = backendPayload?.message
    || (error?.request && !error?.response
      ? "Unable to reach the server. Please check your connection."
      : fallbackMessage);

  const normalized = new Error(message);
  normalized.errors = backendPayload?.errors || [];
  normalized.status = error?.response?.status ?? null;
  return normalized;
}

export default {
  getFuelLogs,
  addFuelLog,
  getDashboardMetrics,
};
