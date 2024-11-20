// models/PatientRequest.js

module.exports = (sequelize, DataTypes) => {
  const PatientRequest = sequelize.define('PatientRequest', {
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'ClinicUsers', key: 'id' },
    },
    medic_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null if the patient requests any available medic
      references: { model: 'ClinicUsers', key: 'id' },
    },
    requested_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    requested_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  return PatientRequest;
};
