// models/ClinicUser.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClinicUser = sequelize.define('ClinicUser', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'medic', 'patient'),
      allowNull: false,
    },
    pin: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subaccount_of: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clinic_users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      validate: {
        isInt: true,
      },
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    photo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'clinic_users',
    hooks: {
      beforeDestroy: (clinicUser, options) => {
        if (clinicUser.role === 'admin') {
          throw new Error('Admin account cannot be deleted.');
        }
      },
    },
  });
  return ClinicUser;

}
