// backend/src/config/db.js
//
// Single shared MySQL connection pool. Every model file across all four
// developers' modules (User.js, Vehicle.js, Driver.js, Trip.js,
// Maintenance.js, FuelLog.js, Expense.js) imports this pool via
// require('../config/db') and calls pool.query(...).
//
// DATABASE_SCHEMA.md: "Database Name: transitops" (MySQL).
// PROJECT_STRUCTURE.md: config/ = "Database connection".

const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Return JS Date objects as-is; DATE columns (license_expiry, start_date,
  // end_date, date) are compared/validated as dates elsewhere in business
  // logic, not as raw strings.
  dateStrings: false,
});

/**
 * Verifies the pool can actually reach the database. Intended to be
 * called once during app.js startup so a bad connection fails at boot
 * with a clear message, rather than surfacing as a mysterious 500 on
 * the first request.
 */
async function verifyConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

module.exports = pool;
module.exports.verifyConnection = verifyConnection;
