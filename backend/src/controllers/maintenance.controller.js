/**
 * maintenance.controller.js
 * Implements the Maintenance APIs defined in API_SPEC.md:
 *   GET    /maintenance
 *   POST   /maintenance
 *   PATCH  /maintenance/:id/close
 *
 * Response envelope matches API_SPEC.md's Standard Success/Error Response.
 */

const Maintenance = require('../models/Maintenance');
const { validateMaintenanceCreation } = require('../utils/validators');
const statusRules = require('../utils/statusRules');

function success(res, status, message, data = {}) {
  return res.status(status).json({ success: true, message, data });
}

function failure(res, status, message, errors = []) {
  return res.status(status).json({ success: false, message, errors });
}

exports.getAllMaintenance = async (req, res) => {
  try {
    const records = await Maintenance.findAll();
    return success(res, 200, 'Maintenance records retrieved successfully.', records);
  } catch (err) {
    return failure(res, 500, 'Failed to retrieve maintenance records.', [err.message]);
  }
};

exports.createMaintenance = async (req, res) => {
  try {
    const errors = validateMaintenanceCreation(req.body);
    if (errors.length) return failure(res, 400, 'Validation failed.', errors);

    const record = await Maintenance.create(req.body);
    // BUSINESS_RULES.md: creating an Active maintenance record sets Vehicle -> In Shop.
    await statusRules.applyMaintenanceCreateTransition(record.vehicle_id);

    return success(res, 201, 'Maintenance record created successfully.', record);
  } catch (err) {
    return failure(res, 500, 'Failed to create maintenance record.', [err.message]);
  }
};

exports.closeMaintenance = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) return failure(res, 404, 'Maintenance record not found.');

    if (!statusRules.canCloseMaintenance(record)) {
      return failure(res, 409, 'Only Active maintenance records can be closed.');
    }

    const end_date = req.body.end_date || new Date().toISOString().slice(0, 10);
    const updatedRecord = await Maintenance.close(record.maintenance_id, end_date);
    // BUSINESS_RULES.md: closing restores Vehicle -> Available, unless Retired.
    await statusRules.applyMaintenanceCloseTransition(record.vehicle_id);

    return success(res, 200, 'Maintenance record closed successfully.', updatedRecord);
  } catch (err) {
    return failure(res, 500, 'Failed to close maintenance record.', [err.message]);
  }
};
