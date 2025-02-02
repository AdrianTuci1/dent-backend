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
const permissionModel = require('./permission');
const clinicUserPermissionModel = require('./clinicUserPermission');
const workingDaysHoursModel = require('./workingDaysHours')
const daysOffModel = require('./daysOff')

const availabilitySlotsModel = require('./AvailabilitySlots');
const patientRequestModel = require('./PatientRequest');
const clinicAvailabilityModel = require('./ClinicAvailability');

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
  const Permission = permissionModel(clinicSequelize, Sequelize.DataTypes);
  const ClinicUserPermission = clinicUserPermissionModel(clinicSequelize, Sequelize.DataTypes);
  const WorkingDaysHours = workingDaysHoursModel(clinicSequelize, Sequelize.DataTypes);
  const DaysOff = daysOffModel(clinicSequelize, Sequelize.DataTypes);
  const AvailabilitySlots = availabilitySlotsModel(clinicSequelize, Sequelize.DataTypes);
  const PatientRequest = patientRequestModel(clinicSequelize, Sequelize.DataTypes);
  const ClinicAvailability = clinicAvailabilityModel(clinicSequelize, Sequelize.DataTypes);

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

  // ClinicUser hasMany Appointments as medic and patient
  ClinicUser.hasMany(Appointment, {
    foreignKey: 'medicUser',
    as: 'medicAppointments',
  });
  ClinicUser.hasMany(Appointment, {
    foreignKey: 'patientUser',
    as: 'patientAppointments',
  });

  Appointment.belongsTo(ClinicUser, {
    foreignKey: 'medicUser',
    as: 'medic',
  });
  Appointment.belongsTo(ClinicUser, {
    foreignKey: 'patientUser',
    as: 'patient',
  });


    // permission relation
  ClinicUser.belongsToMany(Permission, {
    through: ClinicUserPermission,
    foreignKey: 'userId',
    otherKey: 'permissionId',
    as: 'permissions',
  });
  Permission.belongsToMany(ClinicUser, {
    through: ClinicUserPermission,
    foreignKey: 'permissionId',
    otherKey: 'userId',
    as: 'users',
  });

    // ClinicUserPermission associations
  ClinicUserPermission.belongsTo(ClinicUser, {
    foreignKey: 'userId',
    as: 'user',
  });
  ClinicUserPermission.belongsTo(Permission, {
    foreignKey: 'permissionId',
    as: 'permission',
  });


  // Medic associations with WorkingDaysHours and DaysOff
    Medic.hasMany(WorkingDaysHours, {
      foreignKey: 'medicId',
      as: 'workingDaysHours'
    });
    WorkingDaysHours.belongsTo(Medic, {
      foreignKey: 'medicId',
      as: 'medic'
    });

    Medic.hasMany(DaysOff, {
      foreignKey: 'medicId',
      as: 'daysOff'
    });
    DaysOff.belongsTo(Medic, {
      foreignKey: 'medicId',
      as: 'medic'
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

    // If you want to directly associate Appointment with AppointmentTreatment
  Appointment.hasMany(AppointmentTreatment, {
    foreignKey: 'appointmentId',
    as: 'AppointmentTreatments',
  });

  AppointmentTreatment.belongsTo(Appointment, {
    foreignKey: 'appointmentId',
    as: 'appointment',
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

  TreatmentComponent.belongsTo(Component, {
    foreignKey: 'componentId',
    as: 'componentDetails', // Alias to be used in eager loading
  });

  TreatmentComponent.belongsTo(Treatment, {
    foreignKey: 'treatmentId',
    as: 'treatment', // ✅ Correct association
  });

  Treatment.hasMany(TreatmentComponent, {
    foreignKey: 'treatmentId',
    as: 'treatmentComponents', // ✅ Alias must match service query
  });


    // Ensure AppointmentTreatment belongs to Treatment
  AppointmentTreatment.belongsTo(Treatment, {
    foreignKey: 'treatmentId',
    as: 'treatmentDetails',
  });

  // Ensure Treatment has many AppointmentTreatments
  Treatment.hasMany(AppointmentTreatment, {
    foreignKey: 'treatmentId',
    as: 'appointmentTreatments',
  });




    // ClinicUser hasMany PatientRequests as both patient and medic
  PatientRequest.belongsTo(ClinicUser, { foreignKey: 'patient_id', as: 'patient' });
  ClinicUser.hasMany(PatientRequest, { foreignKey: 'patient_id', as: 'requestsByPatient' });

  PatientRequest.belongsTo(ClinicUser, { foreignKey: 'medic_id', as: 'medic' });
  ClinicUser.hasMany(PatientRequest, { foreignKey: 'medic_id', as: 'requestsForMedic' });

  // AvailabilitySlots belongs to ClinicUser as medic
  AvailabilitySlots.belongsTo(ClinicUser, { foreignKey: 'medic_id', as: 'medic' });
  ClinicUser.hasMany(AvailabilitySlots, { foreignKey: 'medic_id', as: 'availabilitySlots' });

  // Relate AvailabilitySlots with ClinicAvailability for clinic-wide tracking
  AvailabilitySlots.belongsTo(ClinicAvailability, { foreignKey: 'clinic_availability_id', as: 'clinicAvailability' });
  ClinicAvailability.hasMany(AvailabilitySlots, { foreignKey: 'clinic_availability_id', as: 'availabilitySlots' });

  // If using DentalHistory model
  ClinicUser.hasMany(DentalHistory, { foreignKey: 'patientId', as: 'dentalHistories' });
  DentalHistory.belongsTo(ClinicUser, { foreignKey: 'patientId', as: 'patient' });

  // Sync the database
  const syncClinicDatabase = async () => {
    try {
      await clinicSequelize.sync({ force: false });
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
    DentalHistory, 
    Permission,
    ClinicUserPermission,
    WorkingDaysHours,
    DaysOff,
    AvailabilitySlots,
    PatientRequest,
    ClinicAvailability,
    syncClinicDatabase,
  };
};

module.exports = initializeClinicDatabase;
