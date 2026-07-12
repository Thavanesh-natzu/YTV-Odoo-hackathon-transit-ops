/**
 * FuelLog.js
 * ---------------------------------------------------------------------------
 * Model / Data-access layer for the `FuelLogs` table.
 *
 * Table: FuelLogs (see DATABASE_SCHEMA.md)
 *   fuel_id     INT             Primary Key, Auto Increment
 *   vehicle_id  INT             Foreign Key -> Vehicles(vehicle_id)
 *   trip_id     INT             Foreign Key -> Trips(trip_id), NULL allowed
 *   liters      DECIMAL(8,2)    NOT NULL
 *   cost        DECIMAL(10,2)   NOT NULL
 *   date        DATE            NOT NULL
 *
 * Per PROJECT_STRUCTURE.md, models are responsible for database access only.
 * Business-rule enforcement (e.g. liters/cost > 0) belongs in the controller;
 * this model only exposes the raw data operations the controller needs,
 * plus a lightweight FK-existence check, which is a data-access concern.
 * ---------------------------------------------------------------------------
 */

const pool = require("../config/database");

/**
 * Coerces DECIMAL columns (which mysql2 returns as strings by default) into
 * JS numbers so downstream consumers (controllers, frontend) always receive
 * consistent numeric types. Purely a data-shape concern — does not alter
 * column names or values.
 * @param {Object} row
 * @returns {Object}
 */
function normalizeFuelLogRow(row) {
  if (!row) return row;
  return {
    ...row,
    liters: row.liters !== null ? Number(row.liters) : row.liters,
    cost: row.cost !== null ? Number(row.cost) : row.cost,
  };
}

class FuelLog {
  /**
   * Confirms a vehicle exists before a fuel log can reference it.
   * Required by BUSINESS_RULES.md -> "Fuel log must reference an existing vehicle."
   * @param {number} vehicleId
   * @returns {Promise<boolean>}
   */
  static async vehicleExists(vehicleId) {
    try {
      const [rows] = await pool.execute(
        "SELECT vehicle_id FROM Vehicles WHERE vehicle_id = ? LIMIT 1",
        [vehicleId]
      );
      return rows.length > 0;
    } catch (error) {
      throw new Error(`FuelLog.vehicleExists failed: ${error.message}`);
    }
  }

  /**
   * Confirms a trip exists (only used when trip_id is provided, since it is
   * nullable per DATABASE_SCHEMA.md).
   * @param {number} tripId
   * @returns {Promise<boolean>}
   */
  static async tripExists(tripId) {
    try {
      const [rows] = await pool.execute(
        "SELECT trip_id FROM Trips WHERE trip_id = ? LIMIT 1",
        [tripId]
      );
      return rows.length > 0;
    } catch (error) {
      throw new Error(`FuelLog.tripExists failed: ${error.message}`);
    }
  }

  /**
   * Retrieves all fuel logs, optionally filtered by vehicle_id, trip_id,
   * or a date range. Used by GET /fuel.
   * @param {Object} filters
   * @param {number} [filters.vehicle_id]
   * @param {number} [filters.trip_id]
   * @param {string} [filters.start_date] - YYYY-MM-DD
   * @param {string} [filters.end_date]   - YYYY-MM-DD
   * @returns {Promise<Array>}
   */
  static async findAll(filters = {}) {
    try {
      const conditions = [];
      const params = [];

      // Only well-formed, present filters are applied. Sanitizing here keeps
      // the query safe even if the controller's own validation is skipped.
      if (filters.vehicle_id !== undefined && filters.vehicle_id !== null) {
        conditions.push("vehicle_id = ?");
        params.push(Number(filters.vehicle_id));
      }

      if (filters.trip_id !== undefined && filters.trip_id !== null) {
        conditions.push("trip_id = ?");
        params.push(Number(filters.trip_id));
      }

      if (filters.start_date) {
        conditions.push("date >= ?");
        params.push(filters.start_date);
      }

      if (filters.end_date) {
        conditions.push("date <= ?");
        params.push(filters.end_date);
      }

      const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const [rows] = await pool.execute(
        `SELECT fuel_id, vehicle_id, trip_id, liters, cost, date
         FROM FuelLogs
         ${whereClause}
         ORDER BY date DESC, fuel_id DESC`,
        params
      );

      return rows.map(normalizeFuelLogRow);
    } catch (error) {
      throw new Error(`FuelLog.findAll failed: ${error.message}`);
    }
  }

  /**
   * Retrieves a single fuel log by its primary key.
   * @param {number} fuelId
   * @returns {Promise<Object|null>}
   */
  static async findById(fuelId) {
    try {
      const [rows] = await pool.execute(
        `SELECT fuel_id, vehicle_id, trip_id, liters, cost, date
         FROM FuelLogs
         WHERE fuel_id = ?
         LIMIT 1`,
        [fuelId]
      );

      return rows.length ? normalizeFuelLogRow(rows[0]) : null;
    } catch (error) {
      throw new Error(`FuelLog.findById failed: ${error.message}`);
    }
  }

  /**
   * Inserts a new fuel log record. Used by POST /fuel.
   * Numeric (> 0) validation is performed by the controller before this is
   * called; this method assumes the caller has already validated input.
   * @param {Object} data
   * @param {number} data.vehicle_id
   * @param {number|null} data.trip_id
   * @param {number} data.liters
   * @param {number} data.cost
   * @param {string} data.date - YYYY-MM-DD
   * @returns {Promise<Object>} the newly created fuel log record
   */
  static async create({ vehicle_id, trip_id = null, liters, cost, date }) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO FuelLogs (vehicle_id, trip_id, liters, cost, date)
         VALUES (?, ?, ?, ?, ?)`,
        [vehicle_id, trip_id, liters, cost, date]
      );

      return await FuelLog.findById(result.insertId);
    } catch (error) {
      throw new Error(`FuelLog.create failed: ${error.message}`);
    }
  }

  /**
   * Total liters and cost for a single vehicle.
   * Used for Fuel Efficiency (Actual Distance / Fuel Consumed) and
   * Operational Cost calculations defined in BUSINESS_RULES.md.
   * @param {number} vehicleId
   * @returns {Promise<{ total_liters: number, total_cost: number }>}
   */
  static async getTotalsByVehicle(vehicleId) {
    try {
      const [rows] = await pool.execute(
        `SELECT
           COALESCE(SUM(liters), 0) AS total_liters,
           COALESCE(SUM(cost), 0)   AS total_cost
         FROM FuelLogs
         WHERE vehicle_id = ?`,
        [vehicleId]
      );

      return {
        total_liters: Number(rows[0].total_liters),
        total_cost: Number(rows[0].total_cost),
      };
    } catch (error) {
      throw new Error(`FuelLog.getTotalsByVehicle failed: ${error.message}`);
    }
  }

  /**
   * Fleet-wide fuel totals. Used by dashboard / reports for aggregate
   * Operational Cost calculations.
   * @returns {Promise<{ total_liters: number, total_cost: number }>}
   */
  static async getFleetTotals() {
    try {
      const [rows] = await pool.execute(
        `SELECT
           COALESCE(SUM(liters), 0) AS total_liters,
           COALESCE(SUM(cost), 0)   AS total_cost
         FROM FuelLogs`
      );

      return {
        total_liters: Number(rows[0].total_liters),
        total_cost: Number(rows[0].total_cost),
      };
    } catch (error) {
      throw new Error(`FuelLog.getFleetTotals failed: ${error.message}`);
    }
  }
}

module.exports = FuelLog;
