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
// const selectClinicDB = require('../middleware/selectClinicDb');

const router = express.Router();

// Use `selectClinicDB` middleware for all routes
// router.use(selectClinicDB);

// Routes requiring subaccount authentication (e.g., medics access)

// Create a new appointment with initial treatment (subaccount access)
router.post('/', authenticate, createAppointment);

// Get appointment details (including treatments) (subaccount access)
router.get('/:appointmentId', authenticate, getAppointmentDetails);

// Update an appointment (subaccount access)
router.put('/:appointmentId', authenticate, updateAppointment);

// Delete an appointment (and its treatments) (subaccount access)
router.delete('/:appointmentId', authenticate, deleteAppointment);

// Add treatment to an appointment (subaccount access)
router.post('/:appointmentId/treatments', authenticate, addTreatmentToAppointment);

// Get all treatments for an appointment (subaccount access)
router.get('/:appointmentId/treatments', authenticate, getAllTreatmentsForAppointment);

// Remove treatment from an appointment (subaccount access)
router.delete('/:appointmentId/treatments/:treatmentId', authenticate, removeTreatmentFromAppointment);

module.exports = router;
