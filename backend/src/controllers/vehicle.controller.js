/**
 * vehicle.controller.js
 * Developer 2 — Vehicle & Driver Management
 *
 * Implements: API_SPEC.md → Vehicle APIs
 *   GET    /vehicles
 *   GET    /vehicles/:id
 *   POST   /vehicles
 *   PUT    /vehicles/:id
 *   DELETE /vehicles/:id
 *
 * Business rules enforced (BUSINESS_RULES.md → Vehicle Rules):
 *   - Registration Number must be unique.
 *   - Vehicle status can only be: Available | On Trip | In Shop | Retired.
 *   - Status is never modified directly through this controller
 *     (API_SPEC.md: "Frontend must never modify status values directly." /
 *      "Status transitions occur only through the dedicated trip and
 *      maintenance endpoints.").
 *
 * Response formats follow API_SPEC.md exactly:
 *   Success: { success: true, message, data }
 *   Error:   { success: false, message, errors: [] }
 */

const Vehicle = require('../models/Vehicle');

const REQUIRED_CREATE_FIELDS = [
  'registration_number',
  'vehicle_name',
  'vehicle_type',
  'max_capacity',
  'acquisition_cost',
];

function validateCreatePayload(body) {
  const errors = [];

  for (const field of REQUIRED_CREATE_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  if (body.max_capacity !== undefined && Number(body.max_capacity) <= 0) {
    errors.push('max_capacity must be greater than zero');
  }

  if (body.acquisition_cost !== undefined && Number(body.acquisition_cost) < 0) {
    errors.push('acquisition_cost must not be negative');
  }

  if (body.odometer !== undefined && Number(body.odometer) < 0) {
    errors.push('odometer must not be negative');
  }

  return errors;
}

function validateUpdatePayload(body) {
  // Same field-level checks as create, but fields are all expected to be present
  // on a full update (PUT semantics).
  const errors = validateCreatePayload(body);
  return errors;
}

function rejectDirectStatusChange(body) {
  // API_SPEC.md: status transitions occur only through dedicated trip/maintenance
  // endpoints. This module must not allow status to be set directly.
  return Object.prototype.hasOwnProperty.call(body, 'status');
}

const vehicleController = {
  /**
   * GET /vehicles
   */
  async getAllVehicles(req, res) {
    try {
      const vehicles = await Vehicle.findAll();
      return res.status(200).json({
        success: true,
        message: 'Vehicles retrieved successfully',
        data: vehicles,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errors: [err.message],
      });
    }
  },

  /**
   * GET /vehicles/:id
   */
  async getVehicleById(req, res) {
    try {
      const { id } = req.params;
      const vehicle = await Vehicle.findById(id);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
          errors: [`No vehicle exists with id ${id}`],
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Vehicle retrieved successfully',
        data: vehicle,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errors: [err.message],
      });
    }
  },

  /**
   * POST /vehicles
   */
  async createVehicle(req, res) {
    try {
      const body = req.body || {};

      if (rejectDirectStatusChange(body)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Vehicle status cannot be set directly. New vehicles start as Available.'],
        });
      }

      const validationErrors = validateCreatePayload(body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      const existing = await Vehicle.findByRegistrationNumber(body.registration_number);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: ['Registration number already exists'],
        });
      }

      const vehicle = await Vehicle.create({
        registration_number: body.registration_number,
        vehicle_name: body.vehicle_name,
        vehicle_type: body.vehicle_type,
        max_capacity: body.max_capacity,
        odometer: body.odometer,
        acquisition_cost: body.acquisition_cost,
      });

      return res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle,
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: ['Registration number already exists'],
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errors: [err.message],
      });
    }
  },

  /**
   * PUT /vehicles/:id
   */
  async updateVehicle(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};

      const existingVehicle = await Vehicle.findById(id);
      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
          errors: [`No vehicle exists with id ${id}`],
        });
      }

      if (rejectDirectStatusChange(body)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [
            'Vehicle status cannot be modified directly. Status changes only through trip/maintenance endpoints.',
          ],
        });
      }

      const validationErrors = validateUpdatePayload(body);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      }

      if (body.registration_number !== existingVehicle.registration_number) {
        const duplicate = await Vehicle.findByRegistrationNumber(body.registration_number);
        if (duplicate && duplicate.vehicle_id !== existingVehicle.vehicle_id) {
          return res.status(409).json({
            success: false,
            message: 'Conflict',
            errors: ['Registration number already exists'],
          });
        }
      }

      const updatedVehicle = await Vehicle.update(id, {
        registration_number: body.registration_number,
        vehicle_name: body.vehicle_name,
        vehicle_type: body.vehicle_type,
        max_capacity: body.max_capacity,
        odometer: body.odometer !== undefined ? body.odometer : existingVehicle.odometer,
        acquisition_cost: body.acquisition_cost,
      });

      return res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: updatedVehicle,
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: ['Registration number already exists'],
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errors: [err.message],
      });
    }
  },

  /**
   * DELETE /vehicles/:id
   */
  async deleteVehicle(req, res) {
    try {
      const { id } = req.params;

      const existingVehicle = await Vehicle.findById(id);
      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
          errors: [`No vehicle exists with id ${id}`],
        });
      }

      if (existingVehicle.status === 'On Trip' || existingVehicle.status === 'In Shop') {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: [`Vehicle cannot be deleted while status is ${existingVehicle.status}`],
        });
      }

      await Vehicle.remove(id);

      return res.status(200).json({
        success: true,
        message: 'Vehicle deleted successfully',
        data: {},
      });
    } catch (err) {
      // Foreign key constraint (Trips / Maintenance / FuelLogs / Expenses reference this vehicle)
      if (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: ['Vehicle cannot be deleted because it is referenced by other records'],
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errors: [err.message],
      });
    }
  },
};

module.exports = vehicleController;
