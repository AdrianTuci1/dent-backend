const express = require('express');
const TreatmentController = require('../controllers/treatmentController');

const router = express.Router();

const treatmentController = new TreatmentController();

// Create a new treatment
router.post('/', treatmentController.createItems);

// Get all treatments
router.get('/', treatmentController.getAllTreatments);

// Get treatment by ID
router.get('/:treatmentId', treatmentController.getTreatmentById)

// Update a treatment by ID
router.put('/:treatmentId', treatmentController.updateItems);
router.put('/', treatmentController.updateItems); // For batch updates

// Delete a treatment by ID
router.delete('/:treatmentId', treatmentController.deleteItems);
router.delete('/', treatmentController.deleteItems); // For batch deletions

module.exports = router;
