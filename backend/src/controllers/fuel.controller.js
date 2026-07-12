/**
 * fuel.controller.js
 * ---------------------------------------------------------------------------
 * Controller for Fuel APIs and the Dashboard API (see note below).
 *
 * Implements (per API_SPEC.md):
 *   GET  /fuel        -> getFuelLogs
 *   POST /fuel        -> addFuelLog
 *   GET  /dashboard    -> getDashboard
 *
 * NOTE on /dashboard placement:
 * TEAM_ASSIGNMENTS.md assigns Developer 4 only FuelLog.js, fuel.controller.js,
 * and fuel.routes.js on the backend, yet also assigns Dashboard.jsx, KPI
 * Cards, Charts, and a Dashboard Metrics Hook on the frontend, and
 * API_SPEC.md defines a GET /dashboard endpoint. No developer is assigned a
 * dashboard.controller.js / dashboard.routes.js file. Since Fuel is the only
 * backend module owned here, the /dashboard handler is implemented in this
 * file and routed through fuel.routes.js so the frontend has a working
 * endpoint to call. If the team later creates a dedicated dashboard module,
 * this handler should be moved there without changing its behavior or the
 * /dashboard endpoint contract.
 *
 * All responses use the standard envelope defined in API_SPEC.md:
 *   Success: { success: true,  message: string, data: object }
 *   Error:   { success: false, message: string, errors: array }
 * ---------------------------------------------------------------------------
 */

const FuelLog = require("../models/FuelLog");
const pool = require("../config/database");

/** Builds the standard success response body (API_SPEC.md). */
function successResponse(message, data = {}) {
  return { success: true, message, data };
}

/** Builds the standard error response body (API_SPEC.md). */
function errorResponse(message, errors = []) {
  return { success: false, message, errors };
}

/**
 * Validates a fuel log creation payload against BUSINESS_RULES.md ->
 * Fuel Rules ("Fuel log must reference an existing vehicle", "Liters and
 * Cost must be greater than zero") plus basic required-field checks.
 * Guards against NaN inputs (e.g. non-numeric strings), which the previous
 * `Number(value) <= 0` check alone would silently let through.
 * @param {Object} body
 * @returns {string[]} list of validation error messages (empty if valid)
 */
function validateFuelLogPayload({ vehicle_id, liters, cost, date }) {
  const errors = [];

  if (vehicle_id === undefined || vehicle_id === null || vehicle_id === "") {
    errors.push("vehicle_id is required");
  }

  const litersValue = Number(liters);
  if (liters === undefined || liters === null || liters === "" || Number.isNaN(litersValue) || litersValue <= 0) {
    errors.push("liters must be a number greater than zero");
  }

  const costValue = Number(cost);
  if (cost === undefined || cost === null || cost === "" || Number.isNaN(costValue) || costValue <= 0) {
    errors.push("cost must be a number greater than zero");
  }

  if (!date) {
    errors.push("date is required");
  }

  return errors;
}

/**
 * GET /fuel
 * Returns fuel logs, optionally filtered by vehicle_id, trip_id, and/or
 * a start_date/end_date range supplied as query parameters.
 */
async function getFuelLogs(req, res) {
  try {
    const { vehicle_id, trip_id, start_date, end_date } = req.query;

    const filters = {};
    if (vehicle_id && !Number.isNaN(Number(vehicle_id))) {
      filters.vehicle_id = Number(vehicle_id);
    }
    if (trip_id && !Number.isNaN(Number(trip_id))) {
      filters.trip_id = Number(trip_id);
    }
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const fuelLogs = await FuelLog.findAll(filters);

    return res
      .status(200)
      .json(successResponse("Fuel logs retrieved successfully", { fuelLogs }));
  } catch (error) {
    return res
      .status(500)
      .json(errorResponse("Failed to retrieve fuel logs", [error.message]));
  }
}

/**
 * POST /fuel
 * Creates a new fuel log entry.
 *
 * Business rules enforced (BUSINESS_RULES.md -> Fuel Rules):
 *   - Fuel log must reference an existing vehicle.
 *   - Liters and Cost must be greater than zero.
 * Additionally, if trip_id is supplied, it must reference an existing trip
 * (DATABASE_SCHEMA.md -> FuelLogs.trip_id is a nullable FK to Trips).
 */
async function addFuelLog(req, res) {
  try {
    const { vehicle_id, trip_id, liters, cost, date } = req.body;

    const validationErrors = validateFuelLogPayload({ vehicle_id, liters, cost, date });

    if (validationErrors.length > 0) {
      return res
        .status(400)
        .json(errorResponse("Validation failed", validationErrors));
    }

    const vehicleExists = await FuelLog.vehicleExists(vehicle_id);
    if (!vehicleExists) {
      return res
        .status(400)
        .json(errorResponse("Validation failed", ["vehicle_id does not reference an existing vehicle"]));
    }

    if (trip_id !== undefined && trip_id !== null) {
      const tripExists = await FuelLog.tripExists(trip_id);
      if (!tripExists) {
        return res
          .status(400)
          .json(errorResponse("Validation failed", ["trip_id does not reference an existing trip"]));
      }
    }

    const fuelLog = await FuelLog.create({
      vehicle_id: Number(vehicle_id),
      trip_id: trip_id ? Number(trip_id) : null,
      liters: Number(liters),
      cost: Number(cost),
      date,
    });

    return res
      .status(201)
      .json(successResponse("Fuel log created successfully", { fuelLog }));
  } catch (error) {
    return res
      .status(500)
      .json(errorResponse("Failed to create fuel log", [error.message]));
  }
}

/**
 * GET /dashboard
 * Returns fleet-wide KPIs as defined in BUSINESS_RULES.md -> Dashboard KPIs:
 *   - Active Vehicles     : vehicles not in a Retired state
 *   - Available Vehicles  : vehicles with status = 'Available'
 *   - Vehicles In Shop    : vehicles with status = 'In Shop'
 *   - Active Trips        : trips with status = 'Dispatched'
 *   - Pending Trips       : trips with status = 'Draft'
 *   - Drivers On Duty     : drivers with status = 'On Trip'
 *   - Fleet Utilization % : (On Trip Vehicles / Total Vehicles) x 100
 *
 * INTERPRETATION NOTE: BUSINESS_RULES.md names these KPIs but only defines
 * an explicit formula for Fleet Utilization. "Active Vehicles" and
 * "Drivers On Duty" are not formally defined elsewhere in the spec. The
 * definitions above are the most literal reading of the ENUM values in
 * DATABASE_SCHEMA.md ("Active" = anything short of the terminal "Retired"
 * state; "On Duty" = currently assigned to a trip). If the team intends a
 * different definition, this function should be updated to match.
 */
async function getDashboard(req, res) {
  try {
    const [[vehicleCounts]] = await pool.query(
      `SELECT
         COUNT(*) AS total_vehicles,
         SUM(status = 'Available') AS available_vehicles,
         SUM(status = 'On Trip')   AS on_trip_vehicles,
         SUM(status = 'In Shop')   AS in_shop_vehicles,
         SUM(status = 'Retired')   AS retired_vehicles
       FROM Vehicles`
    );

    const [[tripCounts]] = await pool.query(
      `SELECT
         SUM(status = 'Dispatched') AS active_trips,
         SUM(status = 'Draft')      AS pending_trips
       FROM Trips`
    );

    const [[driverCounts]] = await pool.query(
      `SELECT
         SUM(status = 'On Trip') AS drivers_on_duty
       FROM Drivers`
    );

    const totalVehicles = Number(vehicleCounts.total_vehicles) || 0;
    const onTripVehicles = Number(vehicleCounts.on_trip_vehicles) || 0;
    const retiredVehicles = Number(vehicleCounts.retired_vehicles) || 0;

    const fleetUtilization =
      totalVehicles > 0 ? Number(((onTripVehicles / totalVehicles) * 100).toFixed(2)) : 0;

    const dashboard = {
      activeVehicles: totalVehicles - retiredVehicles,
      availableVehicles: Number(vehicleCounts.available_vehicles) || 0,
      vehiclesInShop: Number(vehicleCounts.in_shop_vehicles) || 0,
      activeTrips: Number(tripCounts.active_trips) || 0,
      pendingTrips: Number(tripCounts.pending_trips) || 0,
      driversOnDuty: Number(driverCounts.drivers_on_duty) || 0,
      fleetUtilization,
    };

    return res
      .status(200)
      .json(successResponse("Dashboard KPIs retrieved successfully", dashboard));
  } catch (error) {
    return res
      .status(500)
      .json(errorResponse("Failed to retrieve dashboard KPIs", [error.message]));
  }
}

module.exports = {
  getFuelLogs,
  addFuelLog,
  getDashboard,
};
