const { Op } = require('sequelize');  // Import Op directly from Sequelize


// Search for medics

exports.searchMedics = async (req, res, next) => {
  const { query, date, time, duration, medicId } = req.query;

  try {
    const db = req.db;

    // Fetch medics based on the search query
    const medics = await db.ClinicUser.findAll({
      where: {
        role: "medic",
        ...(query ? { name: { [Op.iLike]: `%${query}%` } } : {}),
      },
      attributes: ["id", "name"],
      limit: 10,
      order: [["name", "ASC"]],
    });

    if (!medics.length) {
      return res.status(404).json({ message: "No medics found." });
    }

    req.medics = medics; // Attach medics to the request object

    // Check if all availability parameters are provided
    if (date && time && duration && medicId) {
      return next(); // Proceed to checkMedicAvailability
    }

    // If availability parameters are missing, return the search results
    res.status(200).json({ medics });
  } catch (error) {
    console.error("Error fetching medics:", error);
    res.status(500).json({ error: "Failed to fetch medics." });
  }
};

// Search for patients
exports.searchPatients = async (req, res) => {
  const { query } = req.query;

  try {
    const db = req.db;

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

  try {
    const db = req.db;

    // Fetch treatments based on query, or return the first 10 if no query is provided
    const treatments = await db.Treatment.findAll({
      where: query
        ? { name: { [Op.iLike]: `%${query}%` } } // Filter based on query if provided
        : {}, // No filter if query is empty
      attributes: ['id', 'name', 'duration'], // Include essential attributes
      limit: 10, // Limit the number of results
      order: [['name', 'ASC']], // Sort alphabetically by name
    });

    res.status(200).json(treatments);
  } catch (error) {
    console.error('Error searching treatments:', error);
    res.status(500).json({ error: 'Failed to search treatments.' });
  }
};