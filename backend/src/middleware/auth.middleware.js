// backend/src/middleware/auth.middleware.js
//
// Enforces: "Only authenticated users can access the system." (BUSINESS_RULES.md)
// Enforces: "All APIs except /auth/login require authentication." (API_SPEC.md)
//
// Mount this on every router except the /auth/login route itself.
// On success it attaches req.user = { user_id, role } for downstream
// controllers and role.middleware.js to consume.
//
// Upgrade notes (readability/robustness only - flow and export unchanged):
//   - JWT_SECRET presence validated at module load (matches auth.controller.js).
//   - Authorization header parsing tolerates extra/irregular whitespace.
//   - Distinguishes "expired" vs "malformed" tokens in the server-side log
//     only; the client-facing response is unchanged (401, generic message).

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('auth.middleware.js: JWT_SECRET environment variable is not set');
}

function unauthorized(res, message) {
  // Standard error response shape per API_SPEC.md
  return res.status(401).json({
    success: false,
    message,
    errors: [],
  });
}

async function verifyToken(req, res, next) {
  const authHeader = (req.headers.authorization || '').trim();
  const [scheme, token] = authHeader.split(/\s+/);

  if (scheme !== 'Bearer' || !token) {
    return unauthorized(res, 'Authentication token missing or malformed');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    // Server-side diagnostic only - client message stays generic and
    // unchanged so we never leak whether a token was expired vs forged.
    console.warn('auth.middleware: token verification failed -', err.name);
    return unauthorized(res, 'Invalid or expired token');
  }

  const user = await User.findById(decoded.user_id);
  if (!user) {
    // Token was valid but the account no longer exists
    return unauthorized(res, 'User account not found');
  }

  req.user = {
    user_id: user.user_id,
    role: user.role,
  };

  next();
}

module.exports = verifyToken;
