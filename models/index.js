const Sequelize = require('sequelize');
const clinicModel = require('./mainDB/clinic');
const userModel = require('./mainDB/user');
const clinicUserModel = require('./clinicDB/clinicUser');

// Main database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  logging: false,  // Disable logging to avoid clutter
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { require: true, rejectUnauthorized: false } : false,
  }
});

// Initialize models
const Clinic = clinicModel(sequelize);
const User = userModel(sequelize);
const ClinicUser = clinicUserModel(sequelize)

// Sync models to create tables based on the models
const syncMainDatabase = async () => {
  try {
    await sequelize.authenticate();  // Test connection
    console.log('Connection to the main database has been established successfully.');

    // Sync models (force: true will drop and recreate tables)
    await sequelize.sync({ force: true });  // Change to { force: false } in production to avoid dropping tables
    console.log('Main database tables created or updated successfully.');
  } catch (error) {
    console.error('Error syncing main database:', error);
  }
};

module.exports = {
  sequelize,
  Clinic,
  User,
  ClinicUser,
  syncMainDatabase,
};
