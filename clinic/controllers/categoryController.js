const { Op, fn, col } = require('sequelize');

// Controller to get treatments sorted by category
exports.getTreatmentsByCategory = async (req, res) => {

  try {
    const db = req.db;
    // Fetch all treatments
    const treatments = await db.Treatment.findAll({
      attributes: ['id', 'name', 'category', 'description', 'duration', 'price', 'color'],
      order: [['category', 'ASC'], ['name', 'ASC']], // Sort by category first, then by name
    });

    // Group treatments by category
    const groupedTreatments = treatments.reduce((acc, treatment) => {
      const category = treatment.category || 'Uncategorized'; // Handle null/undefined categories
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(treatment);
      return acc;
    }, {});

    res.status(200).json(groupedTreatments);
  } catch (error) {
    console.error('Error fetching treatments by category:', error);
    res.status(500).json({ message: 'Failed to fetch treatments' });
  }
};


// Controller to get unique categories with case-insensitive search
exports.getUniqueCategories = async (req, res) => {

  try {
    const db = req.db;
    // Extract search filters from query parameters
    const search = req.query.search || '';

    // Query the database for unique categories
    const categories = await db.Treatment.findAll({
      attributes: [[fn('DISTINCT', col('category')), 'category']], // Fetch unique categories
      where: {
        category: {
          [Op.iLike]: `%${search}%`, // Case-insensitive search
        },
      },
      order: [[col('category'), 'ASC']], // Sort categories alphabetically
    });

    // Map results to an array of categories
    const categoryList = categories.map((row) => row.category || 'Uncategorized');

    res.status(200).json(categoryList);
  } catch (error) {
    console.error('Error fetching unique categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};
  