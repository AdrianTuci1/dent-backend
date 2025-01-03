const express = require('express');
const { getTreatmentsByCategory, getUniqueCategories } = require('../controllers/categoryController');
const router = express.Router();

// Get all categories with treatments
router.get('/', getTreatmentsByCategory);

// Get only category names
router.get('/look', getUniqueCategories);

module.exports = router;
