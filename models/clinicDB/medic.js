// models/Medic.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Medic = sequelize.define('Medic', {
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
    specialization: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    employmentType: {
      type: DataTypes.ENUM('full-time', 'part-time'),
      allowNull: true,
    },
    services: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    workingHours: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    daysOff: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
  }, {
    tableName: 'medics',
    timestamps: true, // Include createdAt and updatedAt
  });

  Medic.associate = (models) => {
    Medic.belongsTo(models.ClinicUser, {
      foreignKey: 'id',
      as: 'clinicUser',
    });
  };

  return Medic;
};
