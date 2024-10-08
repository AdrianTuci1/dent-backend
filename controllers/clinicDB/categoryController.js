// categoryController.js
const initializeClinicDatabase = require('../../models/clinicDB');  // Import the initializer function

// Cache the initialized connections to avoid re-initializing for every request
const dbCache = {};

const getClinicDatabase = async (clinicDbName) => {
  if (dbCache[clinicDbName]) {
    return dbCache[clinicDbName];
  }

  const clinicDB = initializeClinicDatabase(clinicDbName);
  dbCache[clinicDbName] = clinicDB;

  return clinicDB;
};

// Create a new category
exports.createCategory = async (req, res) => {
    const { name } = req.body;
    const clinicDbName = req.headers['x-clinic-db'];
  
    if (!clinicDbName) {
      return res.status(400).json({ message: 'Missing clinic database name.' });
    }
  
    try {
      const db = await getClinicDatabase(clinicDbName);
  
      // Create the category
      const category = await db.Category.create({ name });
      res.status(201).json({ message: 'Category created successfully', category });
    } catch (error) {
      res.status(500).json({ message: 'Error creating category', error: error.message });
    }
  };
  
  // Get all categories
  exports.getCategories = async (req, res) => {
    const clinicDbName = req.headers['x-clinic-db'];
  
    if (!clinicDbName) {
      return res.status(400).json({ message: 'Missing clinic database name.' });
    }
  
    try {
      const db = await getClinicDatabase(clinicDbName);
  
      const categories = await db.Category.findAll({ order: [['name', 'ASC']] });
      res.status(200).json({ categories });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
  };
  
  // Delete a category by ID
  exports.deleteCategory = async (req, res) => {
    const { categoryId } = req.params;
    const clinicDbName = req.headers['x-clinic-db'];
  
    if (!clinicDbName) {
      return res.status(400).json({ message: 'Missing clinic database name.' });
    }
  
    try {
      const db = await getClinicDatabase(clinicDbName);
  
      const category = await db.Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      await category.destroy();
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
  };
  