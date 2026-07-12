/**
 * driver.routes.js
 * Developer 2 — Vehicle & Driver Management
 *
 * Maps Driver API endpoints (API_SPEC.md → Driver APIs) to driver.controller.js.
 * Base path is mounted as /api/drivers by app.js (shared file, not modified here).
 *
 * API_SPEC.md: "All APIs except /auth/login require authentication."
 * `authMiddleware` is Developer 1's auth.middleware.js, imported not redefined.
 *
 * NOTE on RBAC: see vehicle.routes.js — role-to-module mapping is not defined
 * in any specification document, so only authentication is enforced here.
 */

const express = require('express');
const router = express.Router();

const driverController = require('../controllers/driver.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

// GET /drivers
router.get('/', driverController.getAllDrivers);

// GET /drivers/:id
router.get('/:id', driverController.getDriverById);

// POST /drivers
router.post('/', driverController.createDriver);

// PUT /drivers/:id
router.put('/:id', driverController.updateDriver);

// DELETE /drivers/:id
router.delete('/:id', driverController.deleteDriver);

module.exports = router;
