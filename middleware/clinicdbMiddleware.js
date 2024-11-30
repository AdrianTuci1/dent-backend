const initializeClinicDatabase = require('../clinic/models'); // Import the initializer function

// Cache the initialized connections to avoid re-initializing for every request
const dbCache = {};

const clinicDatabaseMiddleware = async (req, res, next) => {
  const clinicDbName = req.headers['x-clinic-db']; // Extract the clinic database name from headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    // Check if the database connection is already cached
    if (!dbCache[clinicDbName]) {
      const clinicDB = initializeClinicDatabase(clinicDbName);
      dbCache[clinicDbName] = clinicDB;
    }

    // Attach the database connection to the request object
    req.db = dbCache[clinicDbName];

    next(); // Proceed to the next middleware or controller
  } catch (error) {
    console.error('Error initializing clinic database:', error);
    res.status(500).json({ message: 'Error initializing clinic database', error: error.message });
  }
};

module.exports = clinicDatabaseMiddleware;
