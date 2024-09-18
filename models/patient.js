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
    },
    phone: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.TEXT,
    },
    hygiene_habits: {
      type: DataTypes.ARRAY(DataTypes.TEXT),  // Store hygiene habits as an array of answers
    },
    medical_data: {
      type: DataTypes.ARRAY(DataTypes.TEXT),  // Store medical data
    },
  });

  return Patient;
};
