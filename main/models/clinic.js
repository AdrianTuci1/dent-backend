const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const Clinic = sequelize.define('Clinic', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subdomain: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
        // Add timezone field
        timezone: {
          type: DataTypes.STRING,
          allowNull: false, // Set it to false if you want it to be mandatory
          defaultValue: 'Europe/Bucharest', // Optional: Set a default timezone
        },
  }, {
    tableName: 'clinics',  // Explicitly set lowercase table name
  }
);

  // Hash the clinic password before saving
  Clinic.beforeCreate(async (clinic) => {
    clinic.password = await bcrypt.hash(clinic.password, 10);
  });

  return Clinic;
};
