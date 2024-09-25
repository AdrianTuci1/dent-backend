// models/Patient.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Patient = sequelize.define('Patient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'clinic_users', // Ensure this matches the table name in ClinicUser
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone_number',
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'age',
    },
    medicalHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'medical_history',
    },
    hygieneHabits: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      field: 'hygiene_habits',
    },
    files: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    medicalRecord: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'medical_record',
    },
    tag: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Additional patient-specific fields can be added here
  }, {
    tableName: 'patients',
    timestamps: true, // Add if you want createdAt and updatedAt
  });


  return Patient;
};
