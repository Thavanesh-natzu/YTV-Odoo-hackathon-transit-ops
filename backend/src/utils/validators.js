/**
 * validators.js
 * Field-level input validation for the Trips & Maintenance module.
 * State-based / cross-record business rules live in statusRules.js.
 */

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPositiveNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

function isNonNegativeNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n >= 0;
}

function isValidDate(value) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

/**
 * Validates a new trip payload against the required, NOT NULL columns of
 * the Trips table (DATABASE_SCHEMA.md, Table 4).
 */
function validateTripCreation(body = {}) {
  const errors = [];
  const { vehicle_id, driver_id, source, destination, cargo_weight, planned_distance } = body;

  if (!vehicle_id) errors.push('vehicle_id is required.');
  if (!driver_id) errors.push('driver_id is required.');
  if (!isNonEmptyString(source)) errors.push('source is required.');
  if (!isNonEmptyString(destination)) errors.push('destination is required.');
  if (!isPositiveNumber(cargo_weight)) errors.push('cargo_weight must be a positive number.');
  if (!isPositiveNumber(planned_distance)) errors.push('planned_distance must be a positive number.');

  return errors;
}

/**
 * Validates the optional actual_distance / revenue fields supplied when
 * completing a trip.
 */
function validateTripCompletion(body = {}) {
  const errors = [];
  const { actual_distance, revenue } = body;

  if (actual_distance !== undefined && !isNonNegativeNumber(actual_distance)) {
    errors.push('actual_distance must be a non-negative number.');
  }
  if (revenue !== undefined && !isNonNegativeNumber(revenue)) {
    errors.push('revenue must be a non-negative number.');
  }

  return errors;
}

/**
 * Validates a new maintenance record payload against the required,
 * NOT NULL columns of the Maintenance table (DATABASE_SCHEMA.md, Table 5).
 */
function validateMaintenanceCreation(body = {}) {
  const errors = [];
  const { vehicle_id, description, cost, start_date } = body;

  if (!vehicle_id) errors.push('vehicle_id is required.');
  if (!isNonEmptyString(description)) errors.push('description is required.');
  if (cost !== undefined && !isNonNegativeNumber(cost)) errors.push('cost must be a non-negative number.');
  if (!isValidDate(start_date)) errors.push('start_date must be a valid date.');

  return errors;
}

module.exports = {
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
  validateTripCreation,
  validateTripCompletion,
  validateMaintenanceCreation,
};
