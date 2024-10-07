const express = require('express');
const { createTreatment, getAllTreatments, updateTreatment, deleteTreatment, getTreatmentById } = require('../controllers/clinicDB/treatmentController');
const authenticate = require('../middleware/authenticate'); // JWT Middleware

const router = express.Router();

// Create a new treatment
router.post('/', authenticate, createTreatment);

// Get all treatments
router.get('/', authenticate, getAllTreatments);

// Get treatment by ID
router.get('/:treatmentId', authenticate, getTreatmentById)

// Update a treatment by ID
router.put('/:treatmentId', authenticate, updateTreatment);

// Delete a treatment by ID
router.delete('/:treatmentId', authenticate, deleteTreatment);

module.exports = router;
