// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const AuthenticationController = require('../controllers/authController');
const authenticateMiddleware = require('../../middleware/authenticate'); // Import authentication middleware

// Login route for all roles (clinic, admin, medic, patient)
router.post('/login', AuthenticationController.login);

// Subaccount PIN Login (for medics)
router.post(
  '/subaccount/pin-login',
  authenticateMiddleware,
  AuthenticationController.subaccountPinLogin
);

module.exports = router;
