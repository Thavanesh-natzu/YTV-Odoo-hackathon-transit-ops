// backend/src/middleware/role.middleware.js
//
// Enforces: "User roles determine accessible modules (RBAC)." (BUSINESS_RULES.md)
//
// Valid roles (DATABASE_SCHEMA.md Users.role ENUM - do not modify):
//   'Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'
//
// NOTE: API_SPEC.md's HTTP Status Codes table (200/201/400/401/404/409/500)
// does not list 403. A role check that fails is not the same failure as
// "not authenticated" (401), so this middleware returns 403 Forbidden -
// the standard REST code for "authenticated but not permitted." This is a
// gap in API_SPEC.md that should be formally closed with the team.
//
// Usage in another developer's route file (after auth.middleware.js):
//   router.patch('/:id/dispatch', verifyToken, requireRole('Dispatcher'), tripController.dispatch);
//
// Upgrade notes (readability only - factory signature and both status
// codes are unchanged):
//   - Guards against requireRole() being called with no roles at all,
//     which would otherwise silently reject every request - a
//     misconfiguration bug rather than an intentional lockout.

function requireRole(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new Error('role.middleware.js: requireRole() called with no roles - this would block every request');
  }

  return function (req, res, next) {
    if (!req.user || !req.user.role) {
      // Not authenticated at all - auth.middleware.js should have caught
      // this already, but we don't assume ordering was respected.
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errors: [],
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Authenticated, but this role isn't permitted for this route.
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not permitted to perform this action`,
        errors: [],
      });
    }

    next();
  };
}

module.exports = requireRole;
