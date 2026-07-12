/**
 * maintenance.routes.js
 * Maps the Maintenance API endpoints (API_SPEC.md) to maintenance.controller.js.
 * All routes require authentication per API_SPEC.md's API Rules.
 */

const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const authenticate = require('../middleware/auth.middleware');

router.get('/', authenticate, maintenanceController.getAllMaintenance);
router.post('/', authenticate, maintenanceController.createMaintenance);
router.patch('/:id/close', authenticate, maintenanceController.closeMaintenance);

module.exports = router;
