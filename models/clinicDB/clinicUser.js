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
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pin: {
      type: DataTypes.STRING,
      allowNull: true,  // Optional PIN for subaccounts
    },
    subaccount_of: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clinic_users',
        key: 'id',
      },
      onDelete: 'SET NULL',  // If the main user is deleted, the subaccount remains with NULL parent
    },
  }, {
    tableName: 'clinic_users',  // Explicitly set lowercase table name
  }
);

  return ClinicUser;
};
