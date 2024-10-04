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

// Create Component
exports.createComponent = async (req, res) => {
  const { componentName, unitPrice, vendor, quantity } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

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

// Get All Components
exports.getAllComponents = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    const components = await db.Component.findAll();
    res.status(200).json({ components });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching components', error });
  }
};

// Update Component
exports.updateComponent = async (req, res) => {
  const { componentId } = req.params;
  const { componentName, unitPrice, vendor, quantity } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

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
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

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
