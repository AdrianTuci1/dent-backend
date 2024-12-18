const { Op } = require('sequelize');

// Create Component
exports.createComponent = async (req, res) => {
  const { componentName, unitPrice, vendor, quantity } = req.body;


  try {
    const db = req.db;

    const component = await db.Component.create({
      componentName,
      unitPrice,
      vendor,
      quantity
    });
    res.status(201).json({ message: 'Component created successfully', component });
  } catch (error) {
    res.status(500).json({ message: 'Error creating component', error });
  }
};

// Get All Components with search and pagination
exports.getAllComponents = async (req, res) => {
  try {
    const db = req.db;

    // Extract query parameters for search and pagination
    const { name = '', offset = 0 } = req.query; // Default values: name is empty, offset = 0
    const limit = 20; // Limit results to 20

    // Fetch components with search and pagination
    const components = await db.Component.findAll({
      where: {
        componentName: {
          [Op.like]: `%${name}%`, // Search by name (case-insensitive partial match)
        },
      },
      limit: limit,
      offset: parseInt(offset),
      order: [['componentName', 'ASC']], // Sort components alphabetically
    });

    res.status(200).json({
      components,
      limit,
      offset: parseInt(offset) + limit, // Return next offset for "Load More"
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    res.status(500).json({ message: 'Error fetching components', error });
  }
};


// Update Component
exports.updateComponent = async (req, res) => {
  const { componentId } = req.params;
  const { componentName, unitPrice, vendor, quantity } = req.body;


  try {
    const db = req.db;

    const component = await db.Component.findOne({ where: { id: componentId } });

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    component.componentName = componentName;
    component.unitPrice = unitPrice;
    component.vendor = vendor;
    component.quantity = quantity;
    await component.save();

    res.status(200).json({ message: 'Component updated successfully', component });
  } catch (error) {
    res.status(500).json({ message: 'Error updating component', error });
  }
};

// Delete Component
exports.deleteComponent = async (req, res) => {
  const { componentId } = req.params;

  try {
    const db = req.db;

    const component = await db.Component.findOne({ where: { id: componentId } });

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    await component.destroy();
    res.status(200).json({ message: 'Component deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting component', error });
  }
};
