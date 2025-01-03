const express = require('express');
const { createTreatment, getAllTreatments, updateTreatment, deleteTreatment, getTreatmentById } = require('../controllers/treatmentController');

const router = express.Router();

// Create a new treatment
router.post('/', createTreatment);

// Get all treatments
router.get('/', getAllTreatments);

// Get treatment by ID
router.get('/:treatmentId', getTreatmentById)

// Update a treatment by ID
router.put('/:treatmentId', updateTreatment);

// Delete a treatment by ID
router.delete('/:treatmentId', deleteTreatment);

module.exports = router;
