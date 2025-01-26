const express = require('express');
const ComponentController = require('../controllers/componentController');

const router = express.Router();


// Create a new ComponentController instance
const componentController = new ComponentController();

// Create a new component
router.post('/', componentController.createItems);

// Get all components
router.get('/', componentController.getAllComponents);

// Update a component by ID
router.put('/:componentId', componentController.updateItems);
router.put('/', componentController.updateItems)

// Delete a component by ID
router.delete('/:componentId', componentController.deleteItems);
router.delete('/', componentController.deleteItems)

module.exports = router;
