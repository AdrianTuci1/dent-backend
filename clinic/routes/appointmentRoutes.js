const express = require('express');
const {
  createAppointment,
  getAppointmentDetails,
  updateAppointment,
  deleteAppointment,
  getPatientAppointments,
  getMedicAppointments,
} = require('../controllers/appointmentController');
const {
  addTreatmentToAppointment,
  getAllTreatmentsForAppointment,
  removeTreatmentFromAppointment
} = require('../controllers/appointmentTreatmentController');
const { getWeekAppointments } = require('../controllers/getWeek');
const updateMissedAppointments = require('../middleware/updateMissedAppointments'); 

const router = express.Router();

// Routes requiring subaccount authentication (e.g., medics access)

// Create a new appointment with initial treatment (subaccount access)
router.post('/', createAppointment);

// Get appointment details (including treatments) (subaccount access)
router.get('/:appointmentId',updateMissedAppointments, getAppointmentDetails);

// Update an appointment (subaccount access)
router.put('/:appointmentId',updateMissedAppointments, updateAppointment);

// Delete an appointment (and its treatments) (subaccount access)
router.delete('/:appointmentId', deleteAppointment);

// Add treatment to an appointment (subaccount access)
router.post('/:appointmentId/treatments', addTreatmentToAppointment);

// Get all treatments for an appointment (subaccount access)
router.get('/:appointmentId/treatments', getAllTreatmentsForAppointment);

// Remove treatment from an appointment (subaccount access)
router.delete('/:appointmentId/treatments/:treatmentId', removeTreatmentFromAppointment);

// Get recent appointments for a patient (with pagination and limit)
router.get('/patient/:patientId', getPatientAppointments);

// Get today's or this week's appointments for a medic (with 'today' or 'week' filter)
router.get('/medic/:medicId?', getMedicAppointments);

router.post('/week',updateMissedAppointments, getWeekAppointments)


module.exports = router;
