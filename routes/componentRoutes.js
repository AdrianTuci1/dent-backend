const express = require('express');
const { createComponent, getAllComponents, updateComponent, deleteComponent } = require('../controllers/clinicDB/componentController');
const authenticate = require('../middleware/authenticate'); // JWT Middleware

const router = express.Router();

// Create a new component
router.post('/', authenticate, createComponent);

// Get all components
router.get('/', authenticate, getAllComponents);

// Update a component by ID
router.put('/:componentId', authenticate, updateComponent);

// Delete a component by ID
router.delete('/:componentId', authenticate, deleteComponent);

module.exports = router;
