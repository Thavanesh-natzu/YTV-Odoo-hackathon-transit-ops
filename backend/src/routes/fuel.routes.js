/**
 * fuel.routes.js
 * ---------------------------------------------------------------------------
 * Route definitions for Fuel and Dashboard APIs (see API_SPEC.md).
 *
 *   GET  /fuel        -> fuelController.getFuelLogs
 *   POST /fuel        -> fuelController.addFuelLog
 *   GET  /dashboard    -> fuelController.getDashboard
 *
 * (See the placement note at the top of fuel.controller.js for why the
 * /dashboard route lives here rather than in a dedicated dashboard module.)
 *
 * Per API_SPEC.md -> API Rules: "All APIs except /auth/login require
 * authentication." This file therefore applies the shared authentication
 * middleware owned by Developer 1 (auth.middleware.js). This route file
 * only consumes that middleware; it does not modify it.
 * ---------------------------------------------------------------------------
 */

const express = require("express");
const router = express.Router();

const fuelController = require("../controllers/fuel.controller");
const authenticate = require("../middleware/auth.middleware");

router.use(authenticate);

// ---- Fuel APIs (API_SPEC.md -> Fuel APIs) ---------------------------------
router.get("/fuel", fuelController.getFuelLogs);
router.post("/fuel", fuelController.addFuelLog);

// ---- Dashboard API (API_SPEC.md -> Dashboard APIs) -------------------------
// See placement note in fuel.controller.js for why this lives here.
router.get("/dashboard", fuelController.getDashboard);

module.exports = router;
