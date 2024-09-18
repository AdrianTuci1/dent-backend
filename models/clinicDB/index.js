const Sequelize = require('sequelize');
const clinicUserModel = require('./clinicUser');

// Function to initialize a clinic-specific database connection
const initializeClinicDatabase = (dbName) => {
  const clinicSequelize = new Sequelize(`postgres://admin:admin@postgres:5432/${dbName}`, {
    logging: false,
  });

  // Initialize ClinicUser model for the clinic-specific database
  const ClinicUser = clinicUserModel(clinicSequelize);

  const syncClinicDatabase = async () => {
    try {
      await clinicSequelize.sync({ force: true });  // Sync only clinic-specific models
      console.log(`${dbName} synced successfully.`);
    } catch (error) {
      console.error(`Error syncing ${dbName}:`, error);
    }
  };

  return { clinicSequelize, ClinicUser, syncClinicDatabase };
};

module.exports = initializeClinicDatabase;
