const express = require('express');
const AppointmentController = require('../controllers/appointmentController');
const {
  updateAppointmentTreatments
} = require('../controllers/appointmentTreatmentController');
const { broadcastUpdatedAppointment } = require('../middleware/broadcastUpdatedAppointment');

const router = express.Router();


const appointmentController = new AppointmentController();

// Routes requiring subaccount authentication (e.g., medics access)

// Create a new appointment with initial treatment (subaccount access)
router.post('/', appointmentController.createItems);

// Get appointment details (including treatments) (subaccount access)
router.get('/:appointmentId', appointmentController.getAppointmentDetails);

// Update one or more appointments
router.patch('/', appointmentController.updateItems); // For batch updates
router.patch('/:appointmentId', appointmentController.updateItems); // For single updates

// Delete one or more appointments
router.delete('/', appointmentController.deleteItems); // For batch deletions
router.delete('/:appointmentId', appointmentController.deleteItems); // For single deletions

// Add treatment to an appointment (subaccount access)
router.post('/:appointmentId/treatments', updateAppointmentTreatments);

// Get recent appointments for a patient (with pagination and limit)
router.get('/patient/:patientId', appointmentController.getPatientAppointments);

// Get today's or this week's appointments for a medic (with 'today' or 'week' filter)
router.get('/medic/:medicId?', appointmentController.getMedicAppointments);



module.exports = router;
