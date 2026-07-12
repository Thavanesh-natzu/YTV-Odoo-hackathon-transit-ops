// backend/src/models/User.js
//
// Data access layer for the `Users` table.
// Schema reference: DATABASE_SCHEMA.md - Table 1 : Users
// Columns (exact, do not rename): user_id, name, email, password, role
//
// Do not add columns, rename fields, or change the role ENUM values.
// role ENUM('Fleet Manager','Dispatcher','Safety Officer','Financial Analyst')
//
// Upgrade notes (robustness only - method names/signatures unchanged):
//   - findByEmail() normalizes (trim + lowercase) its own input, so the
//     model behaves consistently whether it's called from auth.controller.js
//     (which already normalizes) or directly from scripts/seed.js.
//   - create() now validates `role` against the known ENUM values before
//     inserting, rather than letting an invalid/missing role hit the DB
//     as a raw constraint violation with a less useful error message.

const db = require('../config/db'); // expected shared MySQL pool (config/ owns connection setup)

const TABLE = 'Users';
const VALID_ROLES = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

/**
 * Find a single user by email. Used by auth.controller.js during login.
 * @param {string} email
 * @returns {Promise<object|null>} full row including password hash, or null
 */
async function findByEmail(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const [rows] = await db.query(
    `SELECT user_id, name, email, password, role FROM ${TABLE} WHERE email = ? LIMIT 1`,
    [normalizedEmail]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Find a single user by primary key. Used by auth.middleware.js to
 * re-attach the current user to req.user on each authenticated request.
 * @param {number} userId
 * @returns {Promise<object|null>} row without password
 */
async function findById(userId) {
  const [rows] = await db.query(
    `SELECT user_id, name, email, role FROM ${TABLE} WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows.length ? rows[0] : null;
}

/**
 * Insert a new user. Not exposed via any API endpoint (API_SPEC.md defines
 * no /auth/register route) - intended for use by scripts/seed.js only,
 * to provision the accounts each role logs in with.
 * @param {{name: string, email: string, passwordHash: string, role: string}} params
 * @returns {Promise<number>} newly created user_id
 */
async function create({ name, email, passwordHash, role }) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(
      `User.create: invalid role "${role}" - must be one of ${VALID_ROLES.join(', ')}`
    );
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();

  const [result] = await db.query(
    `INSERT INTO ${TABLE} (name, email, password, role) VALUES (?, ?, ?, ?)`,
    [name, normalizedEmail, passwordHash, role]
  );
  return result.insertId;
}

/**
 * Strip the password hash before any user object leaves the backend.
 * @param {object} userRow
 */
function toSafeObject(userRow) {
  if (!userRow) return null;
  const { password, ...safe } = userRow;
  return safe;
}

module.exports = {
  findByEmail,
  findById,
  create,
  toSafeObject,
};
