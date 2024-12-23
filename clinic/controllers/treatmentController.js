const { Op } = require('sequelize');

//Create new Treatment
exports.createTreatment = async (req, res) => {
  const { name, category, description, duration, price, componentIds, componentUnits, color } = req.body;

  try {
    const db = req.db;

    // Use a transaction to ensure all steps succeed or fail together
    const transaction = await db.clinicSequelize.transaction();

    try {
      // Find the last treatment and generate the new ID
      const lastTreatment = await db.Treatment.findOne({
        order: [['createdAt', 'DESC']],
        transaction,
      });

      const lastIdNumber = lastTreatment ? parseInt(lastTreatment.id.slice(1), 10) : 0;
      const newIdNumber = lastIdNumber + 1;

      const newTreatmentId = `T${newIdNumber.toString().padStart(3, '0')}`;

      // Create the treatment with the new ID
      const treatment = await db.Treatment.create({
        id: newTreatmentId,
        name,
        category,
        description,
        duration,
        price,
        color,
      }, { transaction });

      // Prepare the treatment components data for the many-to-many relationship
      const treatmentComponentsData = componentIds.map((componentId, index) => ({
        treatmentId: treatment.id,
        componentId,
        componentsUnits: componentUnits[index], // Ensure this matches the model
      }));

      // Log the data to verify
      console.log("Treatment Components Data:", treatmentComponentsData);

      // Insert into TreatmentComponent through table
      await db.TreatmentComponent.bulkCreate(treatmentComponentsData, { transaction });

      // Commit the transaction if all is successful
      await transaction.commit();

      res.status(201).json({ message: 'Treatment created successfully', treatment });
    } catch (error) {
      await transaction.rollback();
      console.error("Error in transaction:", error);
      res.status(500).json({ message: 'Error creating treatment', error: error.message });
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    res.status(500).json({ message: 'Error initializing database', error: error.message });
  }
};




// Get All Treatments with search and pagination
exports.getAllTreatments = async (req, res) => {
  try {
    const db = req.db;

    // Extract query parameters for search and pagination
    const { name = '', offset = 0 } = req.query; // Default: empty search, offset = 0
    const limit = 20; // Limit results to 20 per request

    // Fetch treatments with optional search and pagination
    const treatments = await db.Treatment.findAll({
      where: {
        name: {
          [Op.like]: `%${name}%`, // Search treatments by name
        },
      },
      limit: limit,
      offset: parseInt(offset),
      order: [['name', 'ASC']], // Optional: Sort alphabetically by name
    });

    res.status(200).json({
      treatments,
      limit,
      offset: parseInt(offset) + limit, // Return the next offset for the client
    });
  } catch (error) {
    console.error('Error fetching treatments:', error);
    res.status(500).json({ message: 'Error fetching treatments', error });
  }
};




// Update Treatment by ID
exports.updateTreatment = async (req, res) => {
  const { treatmentId } = req.params;
  const { name, category, description, duration, price, components, color } = req.body; // Use components directly

  try {
    const db = req.db;

    // Start a transaction
    const transaction = await db.clinicSequelize.transaction();

    try {
      // Fetch the existing treatment
      const treatment = await db.Treatment.findOne({ where: { id: treatmentId }, transaction });

      if (!treatment) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Treatment not found' });
      }

      // Validate components array
      if (!Array.isArray(components)) {
        await transaction.rollback();
        return res.status(400).json({ message: '`components` must be an array' });
      }

      // Update treatment fields
      await treatment.update(
        {
          name,
          category,
          description,
          duration,
          price,
          color,
        },
        { transaction }
      );

      // Clear the existing component associations
      await db.TreatmentComponent.destroy({ where: { treatmentId }, transaction });

      // Prepare the new data for components
      const treatmentComponentsData = components.map((comp) => ({
        treatmentId,
        componentId: comp.id, // Extract `id` for componentId
        componentUnits: comp.componentUnits, // Extract `componentUnits`
      }));

      // Log the data to verify structure
      console.log('Updated Treatment Components Data:', treatmentComponentsData);

      // Add updated components to the treatment
      await db.TreatmentComponent.bulkCreate(treatmentComponentsData, { transaction });

      // Commit the transaction
      await transaction.commit();

      res.status(200).json({ message: 'Treatment updated successfully', treatment });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error during update transaction:', error);
      res.status(500).json({ message: 'Error updating treatment', error: error.message });
    }
  } catch (error) {
    console.error('Error initializing database for update:', error);
    res.status(500).json({ message: 'Error initializing database', error: error.message });
  }
};




exports.deleteTreatment = async (req, res) => {
  const { treatmentId } = req.params;

  try {
    const db = req.db;

    const transaction = await db.clinicSequelize.transaction();

    try {
      // Fetch the treatment to ensure it exists
      const treatment = await db.Treatment.findOne({ where: { id: treatmentId }, transaction });

      if (!treatment) {
        return res.status(404).json({ message: 'Treatment not found' });
      }

      // Remove associations in the TreatmentComponent table
      await db.TreatmentComponent.destroy({ where: { treatmentId }, transaction });

      // Delete the treatment
      await treatment.destroy({ transaction });

      await transaction.commit();

      res.status(200).json({ message: 'Treatment deleted successfully' });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ message: 'Error deleting treatment', error });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error initializing database', error });
  }
};



exports.getTreatmentById = async (req, res) => {
  const { treatmentId } = req.params;

  try {
    const db = req.db;

    // Fetch the treatment data
    const treatment = await db.Treatment.findOne({ where: { id: treatmentId } });
    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    // Fetch related components using TreatmentComponent model
    const components = await db.TreatmentComponent.findAll({
      where: { treatmentId },
      include: [
        {
          model: db.Component,
          as: 'component', // Use the correct alias
          attributes: ['id', 'componentName', 'unitPrice']
        }
      ],
      attributes: ['treatmentId', 'componentId', 'componentsUnits']
    });

    // Format the components for the response
    const formattedComponents = components.map(tc => ({
      id: tc.component.id,
      componentName: tc.component.componentName,
      unitPrice: tc.component.unitPrice,
      componentUnits: tc.componentsUnits
    }));

    const treatmentWithComponents = {
      ...treatment.toJSON(),
      components: formattedComponents
    };

    res.status(200).json({ treatment: treatmentWithComponents });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching treatment', error });
  }
};




// Fetch treatments grouped and sorted by category
exports.getTreatmentsByCategory = async (req, res) => {

  try {
    // Fetch the appropriate database instance for the clinic
    const db = req.db;
    
    // Fetch categories and treatments from the clinic database
    const [categories, treatments] = await Promise.all([
      db.Category.findAll({ attributes: ['id', 'name'] }),
      db.Treatment.findAll({ attributes: ['id', 'name', 'category'] })
    ]);

    // Log treatments to debug
    console.log("Fetched treatments:", treatments);

    // Sort treatments by category name
    const sortedData = categories.map((category) => ({
      id: category.id,
      name: category.name,
      treatments: treatments
        .filter((treatment) => {
          const matches = treatment.category == category.name; // Use == for type coercion
          if (!matches) {
            console.log(`Treatment ${treatment.name} with category ${treatment.category} did not match ${category.id}`);
          }
          return matches;
        })
        .sort((a, b) => a.name.localeCompare(b.name)), // Sorting treatments by name
    }));

    res.status(200).json(sortedData);
  } catch (error) {
    console.error('Error retrieving treatments by category:', error);
    res.status(500).json({ error: 'Failed to retrieve treatments by category' });
  }
};
