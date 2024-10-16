const express = require('express');
const { getPatients } = require('../controllers/clinicDB/patientController')

const router = express.Router();

router.get('/', getPatients);


module.exports = router;

//GET / - Retrieve all patients.
//GET /:id - Retrieve data for a specific patient.
//POST / - Add a new patient.
//PUT /:id - Update an existing patient's data.
//DELETE /:id - Delete a patient.