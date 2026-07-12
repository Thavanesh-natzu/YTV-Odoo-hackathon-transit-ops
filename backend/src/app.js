// backend/src/app.js
//
// SHARED FILE (TEAM_ASSIGNMENTS.md: "may only be modified after discussion
// with the team"). This is a draft assembling the pieces defined across
// all four developers' modules - please review as a team before merging.
//
// Architecture (README.md):
//   Frontend (React) -> REST API (Express) -> Controllers -> Models -> MySQL
//
// API_SPEC.md: Base URL is /api. All routes below are mounted under it.
// API_SPEC.md API Rules: "All APIs except /auth/login require authentication."
//   -> auth.middleware.js (verifyToken) is applied to every router except
//      auth.routes.js, which contains the login route itself.

const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const db = require('./config/db');
const verifyToken = require('./middleware/auth.middleware');

// --- Developer 1: Authentication & Users ---
const authRoutes = require('./routes/auth.routes');

// --- Developer 2: Vehicle & Driver Management ---
const vehicleRoutes = require('./routes/vehicle.routes');
const driverRoutes = require('./routes/driver.routes');

// --- Developer 3: Trips & Maintenance ---
const tripRoutes = require('./routes/trip.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');

// --- Developer 4: Fuel ---
const fuelRoutes = require('./routes/fuel.routes');

// --- NOT YET ASSIGNED in TEAM_ASSIGNMENTS.md ---
// API_SPEC.md defines /expenses and /dashboard, but no developer owns
// expense.routes.js / expense.controller.js or dashboard.routes.js /
// dashboard.controller.js. Requiring them here today would crash the
// server for everyone at boot. Uncomment once these files exist and an
// owner has been assigned:
//
// const expenseRoutes = require('./routes/expense.routes');
// const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// --- Global middleware ---
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

// --- Public route: the only one API_SPEC.md exempts from authentication ---
app.use('/api/auth', authRoutes);

// --- Protected routes: verifyToken runs before every controller below ---
app.use('/api/vehicles', verifyToken, vehicleRoutes);
app.use('/api/drivers', verifyToken, driverRoutes);
app.use('/api/trips', verifyToken, tripRoutes);
app.use('/api/maintenance', verifyToken, maintenanceRoutes);
app.use('/api/fuel', verifyToken, fuelRoutes);

// TODO(team): uncomment once owned and implemented.
// app.use('/api/expenses', verifyToken, expenseRoutes);
// app.use('/api/dashboard', verifyToken, dashboardRoutes);

// --- 404 handler: standard error shape per API_SPEC.md ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: [],
  });
});

// --- Central error handler: standard error shape per API_SPEC.md ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: [],
  });
});

// --- Startup ---
// PROJECT_STRUCTURE.md lists app.js as the sole backend/src entry point
// (no separate server.js), so this file both assembles the app and starts
// it. `app` is still exported for use by tests/ (supertest-style testing
// against the Express instance without binding a real port).
//
// Only start listening when this file is run directly - not when it's
// require()'d by a test file, which just needs the exported `app`.
if (require.main === module) {
  db.verifyConnection()
    .then(() => {
      app.listen(env.PORT, () => {
        console.log(`TransitOps backend listening on port ${env.PORT} (${env.NODE_ENV})`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to the database at startup:', err.message);
      process.exit(1);
    });
}

module.exports = app;
