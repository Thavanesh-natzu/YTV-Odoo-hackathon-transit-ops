// backend/src/routes/auth.routes.js
//
// Implements the Authentication section of API_SPEC.md:
//   POST /auth/login
//
// This router is mounted in the shared app.js as:
//   app.use('/api/auth', authRoutes);
// (app.js is a shared file per TEAM_ASSIGNMENTS.md - not modified here.)
//
// Note: this route is intentionally NOT protected by auth.middleware.js -
// API_SPEC.md states "All APIs except /auth/login require authentication."
// A logged-out user must be able to reach this exact route in order to
// become authenticated in the first place; wrapping it in verifyToken
// would make it impossible for anyone to ever log in.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);

module.exports = router;
