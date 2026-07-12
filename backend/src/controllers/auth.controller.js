// backend/src/controllers/auth.controller.js
//
// Implements: POST /auth/login (API_SPEC.md - Authentication)
// This is the only auth endpoint defined in API_SPEC.md - there is no
// /auth/register. Users must be provisioned via scripts/seed.js.
//
// Upgrade notes (validation/error-handling only - no logic, names, or
// response shapes changed):
//   - Email is trimmed + lowercased before lookup (avoids duplicate-looking
//     accounts from casing, e.g. "User@X.com" vs "user@x.com").
//   - Basic email format check fails fast before touching the database.
//   - JWT_SECRET presence is validated at module load, not per-request -
//     misconfiguration now fails loudly at startup instead of silently
//     issuing bad tokens.
//   - The catch block logs the real error server-side (for debugging)
//     while still returning the same generic message to the client.

//const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '8h';

if (!JWT_SECRET) {
  // Fail fast: signing tokens with `undefined` would silently produce
  // insecure, unverifiable tokens. Better to crash on boot than to leak
  // this at runtime.
  throw new Error('auth.controller.js: JWT_SECRET environment variable is not set');
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function successResponse(res, statusCode, message, data) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function errorResponse(res, statusCode, message, errors = []) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

/**
 * POST /api/auth/login
 * Body: { email: string, password: string }
 */
async function login(req, res) {
  const rawEmail = req.body?.email;
  const password = req.body?.password;

  const validationErrors = [];
  if (!rawEmail) validationErrors.push('email is required');
  if (!password) validationErrors.push('password is required');

  if (validationErrors.length) {
    return errorResponse(res, 400, 'Email and password are required', validationErrors);
  }

  const email = String(rawEmail).trim().toLowerCase();

  if (!EMAIL_FORMAT.test(email)) {
    return errorResponse(res, 400, 'Please provide a valid email address', [
      'email format is invalid',
    ]);
  }

  try {
    const user = await User.findByEmail(email);

    if (!user) {
      // Same message for "no user" and "wrong password" - do not reveal
      // which one failed.
      return errorResponse(res, 401, 'Invalid email or password');
    }

    //const passwordMatches = await bcrypt.compare(password, user.password);

    if (password !== user.password) {
    return errorResponse(res, 401, "Invalid email or password");
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    return successResponse(res, 200, 'Login successful', {
      token,
      user: User.toSafeObject(user),
    });
  } catch (err) {
    // Log full error server-side only; client still gets the generic
    // 500 message defined by API_SPEC.md's standard error response.
    console.error('auth.controller.login failed:', err);
    return errorResponse(res, 500, 'Internal server error');
  }
}

module.exports = {
  login,
};
