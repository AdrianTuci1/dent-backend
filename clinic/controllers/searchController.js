const { Op } = require('sequelize');  // Import Op directly from Sequelize
const initializeClinicDatabase = require('../models');

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

// Search for medics
exports.searchMedics = async (req, res) => {
  const { query } = req.query; // Get the search query from the request
  const clinicDbName = req.headers['x-clinic-db']; // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ error: 'Clinic database name is required.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    // Fetch medics based on query, or return first 10 if query is empty
    const medics = await db.ClinicUser.findAll({
      where: {
        role: 'medic',
        ...(query ? { name: { [Op.iLike]: `%${query}%` } } : {}), // Add name filter only if query exists
      },
      attributes: ['id', 'name'], // Select specific attributes to optimize response
      limit: 10, // Limit results to 10 for performance
      order: [['name', 'ASC']], // Sort alphabetically by name
    });

    res.status(200).json(medics);
  } catch (error) {
    console.error('Error searching medics:', error);
    res.status(500).json({ error: 'Failed to search medics.' });
  }
};


// Search for patients
exports.searchPatients = async (req, res) => {
  const { query } = req.query;
  const clinicDbName = req.headers['x-clinic-db']; // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ error: 'Clinic database name is required.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    // Fetch patients based on query, or return first 10 if query is empty
    const patients = await db.ClinicUser.findAll({
      where: {
        role: 'patient',
        ...(query ? { name: { [Op.iLike]: `%${query}%` } } : {}), // Add name filter only if query exists
      },
      attributes: ['id', 'name'], // Select specific attributes to optimize response
      limit: 10, // Limit results to 10 for performance
      order: [['name', 'ASC']], // Sort alphabetically by name
    });

    res.status(200).json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients.' });
  }
};


exports.searchTreatments = async (req, res) => {
  const { query } = req.query; // Get search query from the request
  const clinicDbName = req.headers['x-clinic-db']; // Get clinic database name from headers

  if (!clinicDbName) {
    return res.status(400).json({ error: 'Clinic database name is required.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    // Fetch treatments based on query, or return the first 10 if no query is provided
    const treatments = await db.Treatment.findAll({
      where: query
        ? { name: { [Op.iLike]: `%${query}%` } } // Filter based on query if provided
        : {}, // No filter if query is empty
      attributes: ['id', 'name', 'description'], // Include essential attributes
      limit: 10, // Limit the number of results
      order: [['name', 'ASC']], // Sort alphabetically by name
    });

    res.status(200).json(treatments);
  } catch (error) {
    console.error('Error searching treatments:', error);
    res.status(500).json({ error: 'Failed to search treatments.' });
  }
};