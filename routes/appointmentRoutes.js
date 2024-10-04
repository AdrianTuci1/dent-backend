const express = require('express');
const {
  createAppointment,
  getAppointmentDetails,
  updateAppointment,
  deleteAppointment
} = require('../controllers/clinicDB/appointmentController');
const {
  addTreatmentToAppointment,
  getAllTreatmentsForAppointment,
  removeTreatmentFromAppointment
} = require('../controllers/clinicDB/appointmentTreatmentController');
const authenticate = require('../middleware/authenticate');  // Main account authentication
const authenticateSubaccount = require('../middleware/authenticateSubaccount');  // Subaccount authentication
// const selectClinicDB = require('../middleware/selectClinicDb');

const router = express.Router();

// Use `selectClinicDB` middleware for all routes
// router.use(selectClinicDB);

// Routes requiring subaccount authentication (e.g., medics access)

// Create a new appointment with initial treatment (subaccount access)
router.post('/', authenticateSubaccount, createAppointment);

// Get appointment details (including treatments) (subaccount access)
router.get('/:appointmentId', authenticateSubaccount, getAppointmentDetails);

// Update an appointment (subaccount access)
router.put('/:appointmentId', authenticateSubaccount, updateAppointment);

// Delete an appointment (and its treatments) (subaccount access)
router.delete('/:appointmentId', authenticateSubaccount, deleteAppointment);

// Add treatment to an appointment (subaccount access)
router.post('/:appointmentId/treatments', authenticateSubaccount, addTreatmentToAppointment);

// Get all treatments for an appointment (subaccount access)
router.get('/:appointmentId/treatments', authenticateSubaccount, getAllTreatmentsForAppointment);

// Remove treatment from an appointment (subaccount access)
router.delete('/:appointmentId/treatments/:treatmentId', authenticateSubaccount, removeTreatmentFromAppointment);

module.exports = router;
