/**
 * Driver.js
 * Developer 2 — Vehicle & Driver Management
 *
 * Data access layer for the `Drivers` table.
 * Schema reference: DATABASE_SCHEMA.md → Table 3 : Drivers
 *
 * Columns (must match exactly, per DATABASE_SCHEMA.md):
 *   driver_id         INT PK AUTO_INCREMENT
 *   name              VARCHAR(100) NOT NULL
 *   license_number    VARCHAR(30) UNIQUE NOT NULL
 *   license_category  VARCHAR(20) NOT NULL
 *   license_expiry    DATE NOT NULL
 *   contact           VARCHAR(15) NOT NULL
 *   safety_score      INT DEFAULT 100
 *   status            ENUM('Available','On Trip','Off Duty','Suspended') DEFAULT 'Available'
 *
 * NOTE: `../config/db` is a shared database connection module (mysql2/promise pool),
 * assumed to already exist; not created here (not part of Developer 2's file list).
 */

const pool = require('../config/db');

// Status values exactly as defined in DATABASE_SCHEMA.md — never invent new values.
const DRIVER_STATUS_VALUES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

const Driver = {
  STATUS_VALUES: DRIVER_STATUS_VALUES,

  /**
   * Fetch all drivers.
   */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT driver_id, name, license_number, license_category,
              license_expiry, contact, safety_score, status
       FROM Drivers
       ORDER BY driver_id ASC`
    );
    return rows;
  },

  /**
   * Fetch a single driver by primary key.
   */
  async findById(driverId) {
    const [rows] = await pool.execute(
      `SELECT driver_id, name, license_number, license_category,
              license_expiry, contact, safety_score, status
       FROM Drivers
       WHERE driver_id = ?`,
      [driverId]
    );
    return rows[0] || null;
  },

  /**
   * Fetch a single driver by unique license number.
   * Used to enforce the "License Number must be unique" business rule.
   */
  async findByLicenseNumber(licenseNumber) {
    const [rows] = await pool.execute(
      `SELECT driver_id, name, license_number, license_category,
              license_expiry, contact, safety_score, status
       FROM Drivers
       WHERE license_number = ?`,
      [licenseNumber]
    );
    return rows[0] || null;
  },

  /**
   * Create a new driver.
   * New drivers always start as 'Available' per STATUS_TRANSITIONS.md.
   * safety_score defaults to 100 per DATABASE_SCHEMA.md.
   */
  async create({
    name,
    license_number,
    license_category,
    license_expiry,
    contact,
    safety_score,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO Drivers
        (name, license_number, license_category, license_expiry, contact, safety_score, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Available')`,
      [
        name,
        license_number,
        license_category,
        license_expiry,
        contact,
        safety_score === undefined || safety_score === null ? 100 : safety_score,
      ]
    );
    return this.findById(result.insertId);
  },

  /**
   * Update editable driver fields.
   * Deliberately excludes `status` — status transitions are owned by the
   * trip/maintenance business logic per STATUS_TRANSITIONS.md, not this module.
   */
  async update(driverId, {
    name,
    license_number,
    license_category,
    license_expiry,
    contact,
    safety_score,
  }) {
    await pool.execute(
      `UPDATE Drivers
       SET name = ?,
           license_number = ?,
           license_category = ?,
           license_expiry = ?,
           contact = ?,
           safety_score = ?
       WHERE driver_id = ?`,
      [name, license_number, license_category, license_expiry, contact, safety_score, driverId]
    );
    return this.findById(driverId);
  },

  /**
   * Update only the driver status. Reserved for use by trip business logic
   * (dispatch/complete/cancel), per STATUS_TRANSITIONS.md. Not exposed
   * directly via driver.routes.js.
   */
  async updateStatus(driverId, status) {
    if (!DRIVER_STATUS_VALUES.includes(status)) {
      throw new Error(`Invalid driver status: ${status}`);
    }
    await pool.execute(
      `UPDATE Drivers SET status = ? WHERE driver_id = ?`,
      [status, driverId]
    );
    return this.findById(driverId);
  },

  /**
   * Delete a driver by ID.
   * Returns true if a row was deleted, false if it did not exist.
   * Throws on FK constraint violation (driver referenced by Trips) so the
   * controller can translate that into a 409 Conflict response.
   */
  async remove(driverId) {
    const [result] = await pool.execute(
      `DELETE FROM Drivers WHERE driver_id = ?`,
      [driverId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Driver;
