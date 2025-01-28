const express = require('express');
const PatientController = require('../controllers/patientController')

const router = express.Router();
const patientController = new PatientController();

router.get('/', patientController.getPatients);

// Route to create a new patient
router.post('/', patientController.createItems);

// Route to get a patient by ID
router.get('/:id', patientController.getPatientById);

// Route to update patient details by ID
router.put('/:id', patientController.updateItems);
router.put('/', patientController.updateItems)

// Route to delete a patient by ID
router.delete('/:id', patientController.deleteItems);
router.delete('/', patientController.deleteItems)


module.exports = router;

//GET / - Retrieve all patients.
//GET /:id - Retrieve data for a specific patient.
//POST / - Add a new patient.
//PUT /:id - Update an existing patient's data.
//DELETE /:id - Delete a patient.