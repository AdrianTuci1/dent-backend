// models/patient.js
module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define('Patient', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'ClinicUsers',
        key: 'id',
      },
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    labels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dentalHistory: {
      type: DataTypes.JSON, // Map each tooth to treatments
      allowNull: true,
    },
    files: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Paths or URLs to files
      allowNull: true,
    },
    paymentsMade: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      allowNull: true,
    },
  });

  return Patient;
};
