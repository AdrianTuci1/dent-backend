const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Patient = sequelize.define('Patient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT, // Stores any additional patient notes
      allowNull: true,
    },
    medicalData: {
      type: DataTypes.ARRAY(DataTypes.JSON), // Array of medical data (e.g., previous diagnoses, conditions)
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'), // Gender selection with predefined options
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING, // Stores the patient's address
      allowNull: true,
    },
    hygieneHabits: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Array of strings representing hygiene habits
      allowNull: true,
    },
    appointments: {
      type: DataTypes.ARRAY(DataTypes.JSON), // Store appointment references
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING, // URL or path to the patient's profile image
      allowNull: true,
    },
    files: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Array of file URLs or paths (e.g., medical records, x-rays)
      allowNull: true,
    },
    medicalRecord: {
      type: DataTypes.JSON, // Stores teeth interventions or other medical records in a JSON format
      allowNull: true,
    },
  }, {
    tableName: 'patients',  // Explicit table name
  });

  return Patient;
};
