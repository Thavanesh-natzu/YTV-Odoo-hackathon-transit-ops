/**
 * statusRules.js
 * Encodes the status machines and automatic status transitions defined in
 * BUSINESS_RULES.md and STATUS_TRANSITIONS.md. All status values below are
 * copied verbatim from DATABASE_SCHEMA.md ENUM definitions.
 *
 * Depends on Vehicle.js / Driver.js (Developer 2's module) exposing:
 *   findById(id) -> record | null
 *   updateStatus(id, status) -> record
 */

const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');

const TRIP_STATUS = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const MAINTENANCE_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

const VEHICLE_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
};

const DRIVER_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
};

/** STATUS_TRANSITIONS.md: "Only Draft trips can be dispatched." */
function canDispatch(trip) {
  return trip.status === TRIP_STATUS.DRAFT;
}

/** STATUS_TRANSITIONS.md: "Only Dispatched trips can be completed." */
function canComplete(trip) {
  return trip.status === TRIP_STATUS.DISPATCHED;
}

/** STATUS_TRANSITIONS.md: "Only Draft or Dispatched trips can be cancelled." */
function canCancel(trip) {
  return trip.status === TRIP_STATUS.DRAFT || trip.status === TRIP_STATUS.DISPATCHED;
}

/** STATUS_TRANSITIONS.md: Maintenance Active -> Completed only. */
function canCloseMaintenance(record) {
  return record.status === MAINTENANCE_STATUS.ACTIVE;
}

/**
 * BUSINESS_RULES.md, "Trip Rules": before dispatching a trip, verify
 * vehicle exists, driver exists, vehicle Available, driver Available,
 * driver license valid, cargo weight <= vehicle max capacity.
 */
async function assertDispatchEligibility(trip) {
  const errors = [];

  const vehicle = await Vehicle.findById(trip.vehicle_id);
  const driver = await Driver.findById(trip.driver_id);

  if (!vehicle) errors.push('Vehicle does not exist.');
  if (!driver) errors.push('Driver does not exist.');

  if (vehicle && vehicle.status !== VEHICLE_STATUS.AVAILABLE) {
    errors.push(`Vehicle is not Available (current status: ${vehicle.status}).`);
  }

  if (driver && driver.status !== DRIVER_STATUS.AVAILABLE) {
    errors.push(`Driver is not Available (current status: ${driver.status}).`);
  }

  if (driver) {
    const today = new Date(new Date().toDateString());
    const expiry = new Date(driver.license_expiry);
    if (expiry < today) {
      errors.push('Driver license has expired.');
    }
  }

  if (vehicle && Number(trip.cargo_weight) > Number(vehicle.max_capacity)) {
    errors.push("Cargo weight exceeds the vehicle's maximum capacity.");
  }

  return { valid: errors.length === 0, errors, vehicle, driver };
}

/** Dispatch Trip: Vehicle -> On Trip, Driver -> On Trip. */
async function applyDispatchTransition(trip) {
  await Vehicle.updateStatus(trip.vehicle_id, VEHICLE_STATUS.ON_TRIP);
  await Driver.updateStatus(trip.driver_id, DRIVER_STATUS.ON_TRIP);
}

/**
 * Complete Trip: Vehicle -> Available, Driver -> Available.
 * A Retired vehicle never returns to another state (STATUS_TRANSITIONS.md).
 */
async function applyCompleteTransition(trip) {
  const vehicle = await Vehicle.findById(trip.vehicle_id);
  if (vehicle && vehicle.status !== VEHICLE_STATUS.RETIRED) {
    await Vehicle.updateStatus(trip.vehicle_id, VEHICLE_STATUS.AVAILABLE);
  }
  await Driver.updateStatus(trip.driver_id, DRIVER_STATUS.AVAILABLE);
}

/**
 * Cancel Trip: Vehicle -> Available, Driver -> Available.
 * Only restores availability if the trip had actually moved them to
 * On Trip (i.e. it was Dispatched) — a Draft trip never changed their
 * status in the first place. A Retired vehicle never returns to another state.
 */
async function applyCancelTransition(trip) {
  if (trip.status !== TRIP_STATUS.DISPATCHED) return;

  const vehicle = await Vehicle.findById(trip.vehicle_id);
  if (vehicle && vehicle.status !== VEHICLE_STATUS.RETIRED) {
    await Vehicle.updateStatus(trip.vehicle_id, VEHICLE_STATUS.AVAILABLE);
  }
  await Driver.updateStatus(trip.driver_id, DRIVER_STATUS.AVAILABLE);
}

/** Create Maintenance: Vehicle -> In Shop. */
async function applyMaintenanceCreateTransition(vehicle_id) {
  await Vehicle.updateStatus(vehicle_id, VEHICLE_STATUS.IN_SHOP);
}

/**
 * Close Maintenance: Vehicle -> Available, unless Retired (stays Retired).
 */
async function applyMaintenanceCloseTransition(vehicle_id) {
  const vehicle = await Vehicle.findById(vehicle_id);
  if (vehicle && vehicle.status === VEHICLE_STATUS.RETIRED) return;
  await Vehicle.updateStatus(vehicle_id, VEHICLE_STATUS.AVAILABLE);
}

module.exports = {
  TRIP_STATUS,
  MAINTENANCE_STATUS,
  VEHICLE_STATUS,
  DRIVER_STATUS,
  canDispatch,
  canComplete,
  canCancel,
  canCloseMaintenance,
  assertDispatchEligibility,
  applyDispatchTransition,
  applyCompleteTransition,
  applyCancelTransition,
  applyMaintenanceCreateTransition,
  applyMaintenanceCloseTransition,
};
