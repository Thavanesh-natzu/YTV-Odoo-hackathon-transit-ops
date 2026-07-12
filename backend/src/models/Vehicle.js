/**
 * Vehicle.js
 * Developer 2 — Vehicle & Driver Management
 *
 * Data access layer for the `Vehicles` table.
 * Schema reference: DATABASE_SCHEMA.md → Table 2 : Vehicles
 *
 * Columns (must match exactly, per DATABASE_SCHEMA.md):
 *   vehicle_id          INT PK AUTO_INCREMENT
 *   registration_number VARCHAR(20) UNIQUE NOT NULL
 *   vehicle_name        VARCHAR(100) NOT NULL
 *   vehicle_type        VARCHAR(50) NOT NULL
 *   max_capacity        DECIMAL(8,2) NOT NULL
 *   odometer            INT DEFAULT 0
 *   acquisition_cost    DECIMAL(10,2) NOT NULL
 *   status              ENUM('Available','On Trip','In Shop','Retired') DEFAULT 'Available'
 *
 * NOTE: `../config/db` is a shared database connection module (mysql2/promise pool).
 * It is not owned by Developer 2 per TEAM_ASSIGNMENTS.md and is not created here;
 * it is assumed to already exist (or be created by whoever owns backend/src/config/).
 */

const pool = require('../config/db');

// Status values exactly as defined in DATABASE_SCHEMA.md — never invent new values.
const VEHICLE_STATUS_VALUES = ['Available', 'On Trip', 'In Shop', 'Retired'];

const Vehicle = {
  /**
   * Returns the list of valid vehicle status ENUM values.
   */
  STATUS_VALUES: VEHICLE_STATUS_VALUES,

  /**
   * Fetch all vehicles.
   */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT vehicle_id, registration_number, vehicle_name, vehicle_type,
              max_capacity, odometer, acquisition_cost, status
       FROM Vehicles
       ORDER BY vehicle_id ASC`
    );
    return rows;
  },

  /**
   * Fetch a single vehicle by its primary key.
   */
  async findById(vehicleId) {
    const [rows] = await pool.execute(
      `SELECT vehicle_id, registration_number, vehicle_name, vehicle_type,
              max_capacity, odometer, acquisition_cost, status
       FROM Vehicles
       WHERE vehicle_id = ?`,
      [vehicleId]
    );
    return rows[0] || null;
  },

  /**
   * Fetch a single vehicle by its unique registration number.
   * Used to enforce the "Registration Number must be unique" business rule.
   */
  async findByRegistrationNumber(registrationNumber) {
    const [rows] = await pool.execute(
      `SELECT vehicle_id, registration_number, vehicle_name, vehicle_type,
              max_capacity, odometer, acquisition_cost, status
       FROM Vehicles
       WHERE registration_number = ?`,
      [registrationNumber]
    );
    return rows[0] || null;
  },

  /**
   * Create a new vehicle.
   * New vehicles always start as 'Available' per STATUS_TRANSITIONS.md.
   */
  async create({
    registration_number,
    vehicle_name,
    vehicle_type,
    max_capacity,
    odometer,
    acquisition_cost,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO Vehicles
        (registration_number, vehicle_name, vehicle_type, max_capacity, odometer, acquisition_cost, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Available')`,
      [
        registration_number,
        vehicle_name,
        vehicle_type,
        max_capacity,
        odometer === undefined || odometer === null ? 0 : odometer,
        acquisition_cost,
      ]
    );
    return this.findById(result.insertId);
  },

  /**
   * Update editable vehicle fields.
   * Deliberately excludes `status` — per API_SPEC.md / STATUS_TRANSITIONS.md,
   * status may only be changed through trip/maintenance business logic,
   * never directly by this module.
   */
  async update(vehicleId, {
    registration_number,
    vehicle_name,
    vehicle_type,
    max_capacity,
    odometer,
    acquisition_cost,
  }) {
    await pool.execute(
      `UPDATE Vehicles
       SET registration_number = ?,
           vehicle_name = ?,
           vehicle_type = ?,
           max_capacity = ?,
           odometer = ?,
           acquisition_cost = ?
       WHERE vehicle_id = ?`,
      [
        registration_number,
        vehicle_name,
        vehicle_type,
        max_capacity,
        odometer,
        acquisition_cost,
        vehicleId,
      ]
    );
    return this.findById(vehicleId);
  },

  /**
   * Update only the vehicle status. Reserved for use by trip/maintenance
   * business logic (dispatch, complete, cancel, maintenance open/close),
   * per STATUS_TRANSITIONS.md. Not exposed directly via vehicle.routes.js.
   */
  async updateStatus(vehicleId, status) {
    if (!VEHICLE_STATUS_VALUES.includes(status)) {
      throw new Error(`Invalid vehicle status: ${status}`);
    }
    await pool.execute(
      `UPDATE Vehicles SET status = ? WHERE vehicle_id = ?`,
      [status, vehicleId]
    );
    return this.findById(vehicleId);
  },

  /**
   * Delete a vehicle by ID.
   * Returns true if a row was deleted, false if it did not exist.
   * Throws on FK constraint violation (vehicle referenced by Trips,
   * Maintenance, FuelLogs, or Expenses) so the controller can translate
   * that into a 409 Conflict response.
   */
  async remove(vehicleId) {
    const [result] = await pool.execute(
      `DELETE FROM Vehicles WHERE vehicle_id = ?`,
      [vehicleId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Vehicle;
