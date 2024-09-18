const express = require('express');
const { clinicLogin } = require('../controllers/clinicDB/authController');
const router = express.Router();

// Clinic login route
router.post('/login', clinicLogin);


module.exports = router;
