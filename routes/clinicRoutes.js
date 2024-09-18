const express = require('express');
const router = express.Router();
const { createClinic } = require('../controllers/mainDB/clinicController');

// Route to create a clinic
router.post('/create-clinic', createClinic);

module.exports = router;
