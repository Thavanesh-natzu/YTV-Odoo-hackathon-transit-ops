/**
 * Maintenance.js
 * Data-access model for the Maintenance table (DATABASE_SCHEMA.md, Table 5).
 * No business logic here — see utils/statusRules.js for status transitions
 * and utils/validators.js for input validation.
 */

const pool = require('../config/db');

const Maintenance = {
  /**
   * Insert a new maintenance record. New records always start as 'Active'
   * per STATUS_TRANSITIONS.md.
   */
  async create({ vehicle_id, description, cost, start_date }) {
    const [result] = await pool.query(
      `INSERT INTO Maintenance (vehicle_id, description, cost, start_date, end_date, status)
       VALUES (?, ?, ?, ?, NULL, 'Active')`,
      [vehicle_id, description, cost ?? 0, start_date]
    );
    return this.findById(result.insertId);
  },

  async findAll() {
    const [rows] = await pool.query(`SELECT * FROM Maintenance ORDER BY maintenance_id DESC`);
    return rows;
  },

  async findById(maintenance_id) {
    const [rows] = await pool.query(`SELECT * FROM Maintenance WHERE maintenance_id = ?`, [maintenance_id]);
    return rows[0] || null;
  },

  /**
   * Close an Active maintenance record: status -> Completed, end_date set.
   */
  async close(maintenance_id, end_date) {
    await pool.query(
      `UPDATE Maintenance SET status = 'Completed', end_date = ? WHERE maintenance_id = ?`,
      [end_date, maintenance_id]
    );
    return this.findById(maintenance_id);
  },
};

module.exports = Maintenance;
