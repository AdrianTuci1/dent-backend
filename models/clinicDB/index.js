// models/index.js
const Sequelize = require('sequelize');
const clinicUserModel = require('./clinicUser');
const patientModel = require('./patient');
const medicModel = require('./medic');
const appointmentModel = require('./appointment');
const treatmentModel = require('./treatment');
const componentModel = require('./component');
const appointmentTreatmentModel = require('./appointmentTreatment');
const treatmentComponentModel = require('./treatmentComponent');
const dentalHistoryModel = require('./dentalHistory'); // If using

const initializeClinicDatabase = (dbName) => {
  const clinicSequelize = new Sequelize(`postgres://admin:admin@postgres:5432/${dbName}`, {
    logging: false,
  });

  // Initialize all models
  const ClinicUser = clinicUserModel(clinicSequelize, Sequelize.DataTypes);
  const Patient = patientModel(clinicSequelize, Sequelize.DataTypes);
  const Medic = medicModel(clinicSequelize, Sequelize.DataTypes);
  const Appointment = appointmentModel(clinicSequelize, Sequelize.DataTypes);
  const Treatment = treatmentModel(clinicSequelize, Sequelize.DataTypes);
  const Component = componentModel(clinicSequelize, Sequelize.DataTypes);
  const AppointmentTreatment = appointmentTreatmentModel(clinicSequelize, Sequelize.DataTypes);
  const TreatmentComponent = treatmentComponentModel(clinicSequelize, Sequelize.DataTypes);
  const DentalHistory = dentalHistoryModel(clinicSequelize, Sequelize.DataTypes); // If using

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

  // Medic hasMany Appointments
  Medic.hasMany(Appointment, {
    foreignKey: 'medicId',
    as: 'appointments',
  });
  Appointment.belongsTo(Medic, {
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

  // Many-to-many between Appointment and Treatment via AppointmentTreatment
  Appointment.belongsToMany(Treatment, {
    through: AppointmentTreatment,
    foreignKey: 'appointmentId',
    otherKey: 'treatmentId',
    as: 'treatments',
  });
  Treatment.belongsToMany(Appointment, {
    through: AppointmentTreatment,
    foreignKey: 'treatmentId',
    otherKey: 'appointmentId',
    as: 'appointments',
  });

  // Many-to-many between Treatment and Component via TreatmentComponent
  Treatment.belongsToMany(Component, {
    through: TreatmentComponent,
    foreignKey: 'treatmentId',
    otherKey: 'componentId',
    as: 'components',
  });
  Component.belongsToMany(Treatment, {
    through: TreatmentComponent,
    foreignKey: 'componentId',
    otherKey: 'treatmentId',
    as: 'treatments',
  });

  // If using DentalHistory model
  Patient.hasMany(DentalHistory, { foreignKey: 'patientId', as: 'dentalHistories' });
  DentalHistory.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

  // Sync the database
  const syncClinicDatabase = async () => {
    try {
      await clinicSequelize.sync({ force: true });
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
    AppointmentTreatment,
    TreatmentComponent,
    DentalHistory, // If using
    syncClinicDatabase,
  };
};

module.exports = initializeClinicDatabase;
