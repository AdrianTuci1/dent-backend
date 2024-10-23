const Sequelize = require('sequelize');
const userModel = require('./user');
const clinicModel = require('./clinic');

// Initialize the main Sequelize instance
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
});

// Initialize models
const User = userModel(sequelize);
const Clinic = clinicModel(sequelize);

// Sync the main database with the global models
const syncMainDatabase = async () => {
  try {
    await sequelize.sync({ force: false });  // Sync only global models (users, clinics)
    console.log('Main database synced successfully.');
    return(Clinic)
  } catch (error) {
    console.error('Error syncing main database:', error);
  }
};

// Export the Sequelize instance and models
module.exports = {
  sequelize,
  User,
  Clinic,
  syncMainDatabase,
};
