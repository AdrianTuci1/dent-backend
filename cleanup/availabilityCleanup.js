// cleanup/availabilityCleanup.js
const Op = require('sequelize')
const cron = require('node-cron');
const initializeClinicDatabase = require('../models/clinicDB');
const dbCache = {}; // Cache for clinic databases

const getClinicDatabase = async (clinicDbName) => {
  if (dbCache[clinicDbName]) {
    return dbCache[clinicDbName];
  }

  const clinicDB = initializeClinicDatabase(clinicDbName);
  dbCache[clinicDbName] = clinicDB;

  return clinicDB;
};

// Function to cleanup outdated availability data
const cleanupOutdatedAvailability = async (clinicDbName) => {
  try {
    const db = await getClinicDatabase(clinicDbName);
    const today = new Date();

    // Delete past records from AvailabilitySlots
    await db.AvailabilitySlots.destroy({
      where: {
        date: { [Op.lt]: today },
      },
    });

    // Delete past records from ClinicAvailability
    await db.ClinicAvailability.destroy({
      where: {
        date: { [Op.lt]: today },
      },
    });

    console.log(`Outdated availability data cleaned up for ${clinicDbName}.`);
  } catch (error) {
    console.error('Error cleaning up outdated availability data:', error);
  }
};

// Schedule daily cleanup at midnight
cron.schedule('0 0 * * *', () => {
  // List of clinic databases; modify as needed
  const clinicDatabases = ['demo_db', 'clinic1_db', 'clinic2_db'];
  clinicDatabases.forEach(clinicDbName => cleanupOutdatedAvailability(clinicDbName));
});
