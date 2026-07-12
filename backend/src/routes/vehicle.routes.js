/**
 * vehicle.routes.js
 * Developer 2 — Vehicle & Driver Management
 *
 * Maps Vehicle API endpoints (API_SPEC.md → Vehicle APIs) to vehicle.controller.js.
 * Base path is mounted as /api/vehicles by app.js (shared file, not modified here).
 *
 * API_SPEC.md: "All APIs except /auth/login require authentication."
 * `authMiddleware` is Developer 1's auth.middleware.js (auth.controller.js /
 * auth.routes.js / auth.middleware.js / role.middleware.js) and is imported,
 * not redefined, here.
 *
 * NOTE on RBAC: BUSINESS_RULES.md states roles determine accessible modules,
 * but no specification document maps specific roles to Vehicle/Driver
 * permissions. Per Rule 9, role-based authorization is intentionally not
 * added here to avoid inventing an unspecified business rule — only
 * authentication is enforced. Flag for team clarification if role
 * restriction on this module is required.
 */

const express = require('express');
const router = express.Router();

const vehicleController = require('../controllers/vehicle.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

// GET /vehicles
router.get('/', vehicleController.getAllVehicles);

// GET /vehicles/:id
router.get('/:id', vehicleController.getVehicleById);

// POST /vehicles
router.post('/', vehicleController.createVehicle);

// PUT /vehicles/:id
router.put('/:id', vehicleController.updateVehicle);

// DELETE /vehicles/:id
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
