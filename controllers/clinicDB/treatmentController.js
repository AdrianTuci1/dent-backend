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


//Create new Treatment
exports.createTreatment = async (req, res) => {
  const { name, category, description, duration, price, componentIds, componentUnits } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

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




// Get All Treatments
exports.getAllTreatments = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    const treatments = await db.Treatment.findAll();
    res.status(200).json({ treatments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching treatments', error });
  }
};


//Update Treatment by ID
exports.updateTreatment = async (req, res) => {
  const { treatmentId } = req.params;
  const { name, category, description, duration, price, componentIds, componentUnits } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    const transaction = await db.clinicSequelize.transaction();

    try {
      // Fetch the existing treatment
      const treatment = await db.Treatment.findOne({ where: { id: treatmentId }, transaction });

      if (!treatment) {
        return res.status(404).json({ message: 'Treatment not found' });
      }

      // Update treatment fields
      await treatment.update({
        name,
        category,
        description,
        duration,
        price,
      }, { transaction });

      // Clear the existing component associations
      await db.TreatmentComponent.destroy({ where: { treatmentId }, transaction });

      // Prepare the new data for components with updated componentUnits
      const treatmentComponentsData = componentIds.map((componentId, index) => ({
        treatmentId,
        componentId,
        componentsUnits: componentUnits[index],
      }));

      // Log the data to verify it's structured correctly
      console.log("Updated Treatment Components Data:", treatmentComponentsData);

      // Add updated components to the treatment
      await db.TreatmentComponent.bulkCreate(treatmentComponentsData, { transaction });

      // Commit the transaction if all is successful
      await transaction.commit();

      res.status(200).json({ message: 'Treatment updated successfully', treatment });
    } catch (error) {
      await transaction.rollback();
      console.error("Error during update transaction:", error);
      res.status(500).json({ message: 'Error updating treatment', error: error.message });
    }
  } catch (error) {
    console.error("Error initializing database for update:", error);
    res.status(500).json({ message: 'Error initializing database', error: error.message });
  }
};




exports.deleteTreatment = async (req, res) => {
  const { treatmentId } = req.params;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

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
  const clinicDbName = req.headers['x-clinic-db'];

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

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

