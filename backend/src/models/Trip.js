/**
 * Trip.js
 * Data-access model for the Trips table (DATABASE_SCHEMA.md, Table 4).
 * No business logic here — see utils/statusRules.js for status transitions
 * and utils/validators.js for input validation.
 */

const pool = require('../config/db');

const Trip = {
  /**
   * Insert a new trip. New trips always start as 'Draft' per STATUS_TRANSITIONS.md.
   */
  async create({ vehicle_id, driver_id, source, destination, cargo_weight, planned_distance }) {
    const [result] = await pool.query(
      `INSERT INTO Trips
        (vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, actual_distance, revenue, status)
       VALUES (?, ?, ?, ?, ?, ?, NULL, 0, 'Draft')`,
      [vehicle_id, driver_id, source, destination, cargo_weight, planned_distance]
    );
    return this.findById(result.insertId);
  },

  async findAll() {
    const [rows] = await pool.query(`SELECT * FROM Trips ORDER BY trip_id DESC`);
    return rows;
  },

  async findById(trip_id) {
    const [rows] = await pool.query(`SELECT * FROM Trips WHERE trip_id = ?`, [trip_id]);
    return rows[0] || null;
  },

  /**
   * Update a trip's status, optionally updating actual_distance / revenue
   * (used on completion). Column names match DATABASE_SCHEMA.md exactly.
   */
  async updateStatus(trip_id, status, extra = {}) {
    const fields = ['status = ?'];
    const values = [status];

    if (extra.actual_distance !== undefined) {
      fields.push('actual_distance = ?');
      values.push(extra.actual_distance);
    }
    if (extra.revenue !== undefined) {
      fields.push('revenue = ?');
      values.push(extra.revenue);
    }

    values.push(trip_id);

    await pool.query(`UPDATE Trips SET ${fields.join(', ')} WHERE trip_id = ?`, values);
    return this.findById(trip_id);
  },
};

module.exports = Trip;
