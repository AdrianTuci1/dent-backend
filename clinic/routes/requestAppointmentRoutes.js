// routes/appointmentRoutes.js

const express = require('express');
const { getAvailableDates, getAvailableTimeSlots, requestAppointment, listAppointmentRequests } = require('../controllers/appointmentRequestController');
const router = express.Router();

router.get('/available-dates', getAvailableDates);
router.get('/available-time-slots', getAvailableTimeSlots);
router.post('/request-appointment', requestAppointment);
router.get('/view-requests', listAppointmentRequests);

module.exports = router;
