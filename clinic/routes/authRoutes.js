// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const AuthenticationController = require('../controllers/authController');
const authenticate = require('../../middleware/authenticate');

// Login route for all roles (clinic, admin, medic, patient)
router.post('/login', AuthenticationController.login);

// Subaccount PIN Login (for medics)
router.post(
  '/subaccount/pin-login',
  authenticate, // Ensure clinic user is authenticated
  AuthenticationController.subaccountPinLogin
);

module.exports = router;
