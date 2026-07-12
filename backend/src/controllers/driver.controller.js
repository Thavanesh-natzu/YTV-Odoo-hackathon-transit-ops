/**
 * driver.controller.js
 * Developer 2 — Vehicle & Driver Management
 *
 * Implements: API_SPEC.md → Driver APIs
 *   GET    /drivers
 *   GET    /drivers/:id
 *   POST   /drivers
 *   PUT    /drivers/:id
 *   DELETE /drivers/:id
 *
 * Business rules enforced (BUSINESS_RULES.md → Driver Rules):
 *   - License Number must be unique.
 *   - License Expiry Date must be greater than or equal to the current date.
 *   - Suspended drivers cannot be assigned to trips (enforced here at read-level
 *     is not applicable; assignment validation itself lives in Developer 3's
 *     trip module — this controller only guards driver CRUD).
 *   - Status is never modified directly through this controller
 *     (status transitions occur only through dedicated trip endpoints).
 *
 * Response formats follow API_SPEC.md exactly:
 *   Success: { success: true, message, data }
 *   Error:   { success: false, message, errors: [] }
 */

const Driver = require('../models/Driver');

const REQUIRED_CREATE_FIELDS = [
  'name',
  'license_number',
  'license_category',
  'license_expiry',
  'contact',
];

function isValidFutureOrTodayDate(dateStr) {
  const inputDate = new Date(dateStr);
  if (Number.isNaN(inputDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);

  return inputDate.getTime() >= today.getTime();
}

function validateCreatePayload(body) {
  const errors = [];

  for (const field of REQUIRED_CREATE_FIELDS) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  if (body.license_expiry && !isValidFutureOrTodayDate(body.license_expiry)) {
    errors.push('license_expiry must be greater than or equal to the current date');
  }

  if (body.safety_score !== undefined) {
    const score = Number(body.safety_score);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      errors.push('safety_score must be a number between 0 and 100');
    }
  }

  return errors;
}

function validateUpdatePayload(body) {
  return validateCreatePayload(body);
}

function rejectDirectStatusChange(body) {
  return Object.prototype.hasOwnProperty.call(body, 'status');
}

const driverController = {
  /**
   * GET /drivers
   */
  async getAllDrivers(req, res) {
    try {
      const drivers = await Driver.findAll();
      return res.status(200).json({
        success: true,
        message: 'Drivers retrieved successfully',
        data: drivers,
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
   * GET /drivers/:id
   */
  async getDriverById(req, res) {
    try {
      const { id } = req.params;
      const driver = await Driver.findById(id);

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
          errors: [`No driver exists with id ${id}`],
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Driver retrieved successfully',
        data: driver,
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
   * POST /drivers
   */
  async createDriver(req, res) {
    try {
      const body = req.body || {};

      if (rejectDirectStatusChange(body)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: ['Driver status cannot be set directly. New drivers start as Available.'],
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

      const existing = await Driver.findByLicenseNumber(body.license_number);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: ['License number already exists'],
        });
      }

      const driver = await Driver.create({
        name: body.name,
        license_number: body.license_number,
        license_category: body.license_category,
        license_expiry: body.license_expiry,
        contact: body.contact,
        safety_score: body.safety_score,
      });

      return res.status(201).json({
        success: true,
        message: 'Driver created successfully',
        data: driver,
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: ['License number already exists'],
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
   * PUT /drivers/:id
   */
  async updateDriver(req, res) {
    try {
      const { id } = req.params;
      const body = req.body || {};

      const existingDriver = await Driver.findById(id);
      if (!existingDriver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
          errors: [`No driver exists with id ${id}`],
        });
      }

      if (rejectDirectStatusChange(body)) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: [
            'Driver status cannot be modified directly. Status changes only through trip endpoints.',
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

      if (body.license_number !== existingDriver.license_number) {
        const duplicate = await Driver.findByLicenseNumber(body.license_number);
        if (duplicate && duplicate.driver_id !== existingDriver.driver_id) {
          return res.status(409).json({
            success: false,
            message: 'Conflict',
            errors: ['License number already exists'],
          });
        }
      }

      const updatedDriver = await Driver.update(id, {
        name: body.name,
        license_number: body.license_number,
        license_category: body.license_category,
        license_expiry: body.license_expiry,
        contact: body.contact,
        safety_score:
          body.safety_score !== undefined ? body.safety_score : existingDriver.safety_score,
      });

      return res.status(200).json({
        success: true,
        message: 'Driver updated successfully',
        data: updatedDriver,
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: ['License number already exists'],
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
   * DELETE /drivers/:id
   */
  async deleteDriver(req, res) {
    try {
      const { id } = req.params;

      const existingDriver = await Driver.findById(id);
      if (!existingDriver) {
        return res.status(404).json({
          success: false,
          message: 'Driver not found',
          errors: [`No driver exists with id ${id}`],
        });
      }

      if (existingDriver.status === 'On Trip') {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: ['Driver cannot be deleted while status is On Trip'],
        });
      }

      await Driver.remove(id);

      return res.status(200).json({
        success: true,
        message: 'Driver deleted successfully',
        data: {},
      });
    } catch (err) {
      // Foreign key constraint (Trips reference this driver)
      if (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          success: false,
          message: 'Conflict',
          errors: ['Driver cannot be deleted because it is referenced by other records'],
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

module.exports = driverController;
