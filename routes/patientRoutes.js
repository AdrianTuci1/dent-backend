const express = require('express');
const { getPatients, createPatient, getPatientById, updatePatient, deletePatient } = require('../controllers/clinicDB/patientController')

const router = express.Router();

router.get('/', getPatients);

// Route to create a new patient
router.post('/', createPatient);

// Route to get a patient by ID
router.get('/:id', getPatientById);

// Route to update patient details by ID
router.put('/:id', updatePatient);

// Route to delete a patient by ID
router.delete('/:id', deletePatient);


module.exports = router;

//GET / - Retrieve all patients.
//GET /:id - Retrieve data for a specific patient.
//POST / - Add a new patient.
//PUT /:id - Update an existing patient's data.
//DELETE /:id - Delete a patient.