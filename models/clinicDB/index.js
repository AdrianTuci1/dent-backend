// models/index.js
const Sequelize = require('sequelize');
const clinicUserModel = require('./clinicUser');
const patientModel = require('./patient');
const medicModel = require('./medic'); // Ensure this import exists
const appointmentModel = require('./appointment');
const treatmentModel = require('./treatment');
const componentModel = require('./component');

// Function to initialize a clinic-specific database connection
const initializeClinicDatabase = (dbName) => {
  const clinicSequelize = new Sequelize(`postgres://admin:admin@postgres:5432/${dbName}`, {
    logging: false, // Disable logging; set to true for debugging
  });

  // Initialize all models
  const ClinicUser = clinicUserModel(clinicSequelize);
  const Patient = patientModel(clinicSequelize);
  const Medic = medicModel(clinicSequelize);
  const Appointment = appointmentModel(clinicSequelize);
  const Treatment = treatmentModel(clinicSequelize);
  const Component = componentModel(clinicSequelize);

  // Set up associations

  // ClinicUser hasOne Patient
  ClinicUser.hasOne(Patient, {
    foreignKey: 'id',
    as: 'patientProfile',
    onDelete: 'CASCADE',
    hooks: true,
  });
  Patient.belongsTo(ClinicUser, {
    foreignKey: 'id',
    as: 'clinicUser',
  });

  // ClinicUser hasOne Medic
  ClinicUser.hasOne(Medic, {
    foreignKey: 'id',
    as: 'medicProfile',
    onDelete: 'CASCADE',
    hooks: true,
  });
  Medic.belongsTo(ClinicUser, {
    foreignKey: 'id',
    as: 'clinicUser',
  });

  // Self-referential associations for subaccounts
  ClinicUser.belongsTo(ClinicUser, {
    foreignKey: 'subaccount_of',
    as: 'parentUser',
  });
  ClinicUser.hasMany(ClinicUser, {
    foreignKey: 'subaccount_of',
    as: 'subaccounts',
  });

  // ClinicUser (Medic) hasMany Appointments
  ClinicUser.hasMany(Appointment, {
    foreignKey: 'medicId',
    as: 'appointmentsAsMedic',
  });
  Appointment.belongsTo(ClinicUser, {
    foreignKey: 'medicId',
    as: 'medic',
  });

  // Patient hasMany Appointments
  Patient.hasMany(Appointment, {
    foreignKey: 'patientId',
    as: 'appointments',
  });
  Appointment.belongsTo(Patient, {
    foreignKey: 'patientId',
    as: 'patient',
  });

  // Appointment hasMany Treatments
  Appointment.hasMany(Treatment, {
    foreignKey: 'appointmentId',
    as: 'treatments',
  });
  Treatment.belongsTo(Appointment, {
    foreignKey: 'appointmentId',
    as: 'appointment',
  });

  // Treatment hasMany Components
  Treatment.hasMany(Component, {
    foreignKey: 'treatmentId',
    as: 'components',
  });
  Component.belongsTo(Treatment, {
    foreignKey: 'treatmentId',
    as: 'treatment',
  });

  // Sync the database
  const syncClinicDatabase = async () => {
    try {
      await clinicSequelize.sync({ force: true }); // Set to true to drop and recreate tables
      console.log(`${dbName} synced successfully.`);
    } catch (error) {
      console.error(`Error syncing ${dbName}:`, error);
    }
  };

  return {
    clinicSequelize,
    ClinicUser,
    Patient,
    Medic,
    Appointment,
    Treatment,
    Component,
    syncClinicDatabase,
  };
};

module.exports = initializeClinicDatabase;
