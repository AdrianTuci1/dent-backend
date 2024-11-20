const { Sequelize } = require('sequelize');
const { Clinic } = require('../main/models');  // Import Clinic model from the main database
const initializeClinicDatabase = require('../clinic/models');  // Function to initialize clinic-specific DB

const connections = {};  // Cache for active connections to avoid reconnecting multiple times

// Function to get or create a dynamic connection to the clinic's database
const getClinicConnection = async (clinicSubdomain) => {
  // If the connection already exists in the cache, return it
  if (connections[clinicSubdomain]) {
    return connections[clinicSubdomain];
  }

  // Get the clinic details from the central database
  const clinic = await Clinic.findOne({ where: { subdomain: clinicSubdomain } });
  if (!clinic) {
    throw new Error('Clinic not found');
  }

  // Initialize a new connection to the clinic's specific database using the clinic's db_name
  const { clinicSequelize, syncClinicDatabase } = initializeClinicDatabase(clinic.db_name);

  // Sync the clinic's database if needed (optional)
  await syncClinicDatabase();

  // Cache the connection to reuse it for future requests
  connections[clinicSubdomain] = clinicSequelize;

  // Return the dynamic connection
  return clinicSequelize;
};

module.exports = { getClinicConnection };
