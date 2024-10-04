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

// Create Treatment with Components
exports.createTreatment = async (req, res) => {
  const { name, category, description, duration, componentIds, componentUnits } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    // Fetch selected components
    const components = await db.Component.findAll({
      where: { id: componentIds }
    });

    if (!components || components.length === 0) {
      return res.status(404).json({ message: 'No components found' });
    }

    // Calculate total price
    let totalPrice = 0;
    components.forEach((component, index) => {
      totalPrice += component.unitPrice * componentUnits[index];
    });

    // Create the treatment with components
    const treatment = await db.Treatment.create({
      name,
      category,
      description,
      duration,
      price: totalPrice, // Total price of all components
      components: components.map(comp => comp.componentName),
      componentsUnits: componentUnits
    });

    res.status(201).json({ message: 'Treatment created successfully', treatment });
  } catch (error) {
    res.status(500).json({ message: 'Error creating treatment', error });
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

// Update Treatment
exports.updateTreatment = async (req, res) => {
  const { treatmentId } = req.params;
  const { name, category, description, duration, componentIds, componentUnits } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    const treatment = await db.Treatment.findOne({ where: { id: treatmentId } });

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    // Fetch selected components
    const components = await db.Component.findAll({
      where: { id: componentIds }
    });

    if (!components || components.length === 0) {
      return res.status(404).json({ message: 'No components found' });
    }

    // Calculate total price
    let totalPrice = 0;
    components.forEach((component, index) => {
      totalPrice += component.unitPrice * componentUnits[index];
    });

    treatment.name = name;
    treatment.category = category;
    treatment.description = description;
    treatment.duration = duration;
    treatment.price = totalPrice; // Update price
    treatment.components = components.map(comp => comp.componentName);
    treatment.componentsUnits = componentUnits;

    await treatment.save();

    res.status(200).json({ message: 'Treatment updated successfully', treatment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating treatment', error });
  }
};

// Delete Treatment
exports.deleteTreatment = async (req, res) => {
  const { treatmentId } = req.params;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    const treatment = await db.Treatment.findOne({ where: { id: treatmentId } });

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    await treatment.destroy();
    res.status(200).json({ message: 'Treatment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting treatment', error });
  }
};
