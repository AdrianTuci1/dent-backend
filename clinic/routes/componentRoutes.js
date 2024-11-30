const express = require('express');
const { createComponent, getAllComponents, updateComponent, deleteComponent } = require('../controllers/componentController');

const router = express.Router();

// Create a new component
router.post('/',  createComponent);

// Get all components
router.get('/', getAllComponents);

// Update a component by ID
router.put('/:componentId', updateComponent);

// Delete a component by ID
router.delete('/:componentId', deleteComponent);

module.exports = router;
