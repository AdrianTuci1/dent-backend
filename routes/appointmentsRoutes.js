const express = require('express');
const { getAppointments, createAppointment } = require('../controllers/appointmentsController');
const router = express.Router();

// Fetch appointments within a specific week
router.get('/appointments', getAppointments);

// Create a new appointment
router.post('/appointments', createAppointment);

module.exports = router;
