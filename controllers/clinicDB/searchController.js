const { Op } = require('sequelize');  // Import Op directly from Sequelize
const initializeClinicDatabase = require('../../models/clinicDB');

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

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  try {
    const db = await getClinicDatabase(clinicDbName);

    // Use ILIKE for PostgreSQL (use LIKE for MySQL)
    const medics = await db.ClinicUser.findAll({
      where: {
        role: 'medic',
        name: { [Op.iLike]: `%${query}%` },  // Use Op directly for the case-insensitive match
      },
      attributes: ['id', 'name'],
      limit: 10,  // Limit results to 10 for performance
      order: [['name', 'ASC']],  // Sort alphabetically by name
    });

    res.status(200).json(medics);
  } catch (error) {
    console.error('Error searching medics:', error);
    res.status(500).json({ error: 'Failed to search medics' });
  }
};

// Search for patients
exports.searchPatients = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  try {
    const db = await getClinicDatabase(clinicDbName);

    const patients = await db.ClinicUser.findAll({
      where: {
        role: 'patient',
        name: { [Op.iLike]: `%${query}%` },  // Use Op for partial match
      },
      attributes: ['id', 'name'],
      limit: 10,
      order: [['name', 'ASC']],
    });

    res.status(200).json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
};
