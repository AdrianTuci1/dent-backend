const express = require('express');
const { createCategory, getCategories, deleteCategory } = require('../controllers/categoryController');
const router = express.Router();

// Add a new category
router.post('/', createCategory);

// Get all categories
router.get('/', getCategories);

// Delete a category
router.delete('/:categoryId', deleteCategory);

module.exports = router;
