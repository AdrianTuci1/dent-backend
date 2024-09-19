const Sequelize = require('sequelize');
const clinicUserModel = require('./clinicUser');
const appointmentModel = require('./appointment');
const patientModel = require('./patient');
const treatmentModel = require('./treatment');
const componentModel = require('./component');

// Function to initialize a clinic-specific database connection
const initializeClinicDatabase = (dbName) => {
  const clinicSequelize = new Sequelize(`postgres://admin:admin@postgres:5432/${dbName}`, {
    logging: false,
  });

  // Initialize all models
  const ClinicUser = clinicUserModel(clinicSequelize); // ClinicUser handles both regular users and medics
  const Appointment = appointmentModel(clinicSequelize);
  const Patient = patientModel(clinicSequelize);
  const Treatment = treatmentModel(clinicSequelize);
  const Component = componentModel(clinicSequelize);

  // Set up associations
  ClinicUser.hasMany(Appointment, { foreignKey: 'medicId' });  // A ClinicUser (medic) can have many appointments
  Appointment.belongsTo(ClinicUser, { foreignKey: 'medicId' });  // Each appointment belongs to one medic

  Patient.hasMany(Appointment, { foreignKey: 'patientId' });  // A patient can have many appointments
  Appointment.belongsTo(Patient, { foreignKey: 'patientId' });  // Each appointment belongs to one patient

  Appointment.hasMany(Treatment, { foreignKey: 'appointmentId' });  // An appointment can have many treatments
  Treatment.belongsTo(Appointment, { foreignKey: 'appointmentId' });  // Each treatment belongs to one appointment

  Treatment.hasMany(Component, { foreignKey: 'treatmentId' });  // A treatment can have many components (tools or materials)
  Component.belongsTo(Treatment, { foreignKey: 'treatmentId' });  // Each component belongs to a treatment

  // Sync the database
  const syncClinicDatabase = async () => {
    try {
      await clinicSequelize.sync({ force: false });  // Sync all models
      console.log(`${dbName} synced successfully.`);
    } catch (error) {
      console.error(`Error syncing ${dbName}:`, error);
    }
  };

  return {
    clinicSequelize,
    ClinicUser,
    Appointment,
    Patient,
    Treatment,
    Component,
    syncClinicDatabase,
  };
};

module.exports = initializeClinicDatabase;
