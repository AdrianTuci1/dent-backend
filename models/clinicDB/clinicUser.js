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
    employmentType: {
      type: DataTypes.ENUM('full-time', 'part-time'),
      allowNull: true,  // Can be populated later
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true,  // Can be populated later
    },
    photo: {
      type: DataTypes.STRING,  // URL or path to the medic's profile photo
      allowNull: true,  // Can be populated later
    },
    services: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,  // List of services, can be populated later
    },
    workingHours: {
      type: DataTypes.JSON,  // Working hours (e.g., { "Mon": "9am-5pm" })
      allowNull: true,  // Can be populated later
    },
    daysOff: {
      type: DataTypes.ARRAY(DataTypes.STRING),  // Array of days off (e.g., ['Saturday', 'Sunday'])
      allowNull: true,  // Can be populated later
    },
    permissions: {
      type: DataTypes.JSON,  // Store permission levels as JSON (e.g., { createAppointment: true, viewRecords: true })
      allowNull: true,  // Permissions can be defined later
    },
  }, {
    tableName: 'clinic_users',  // Explicitly set lowercase table name
    hooks: {
      beforeDestroy: (clinicUser, options) => {
        // Prevent removal of the admin subaccount
        if (clinicUser.role === 'admin') {
          throw new Error('Admin subaccount cannot be deleted.');
        }
      },
    },
  });

  return ClinicUser;
};
