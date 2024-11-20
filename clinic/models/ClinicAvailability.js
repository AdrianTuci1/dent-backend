// models/ClinicAvailability.js

module.exports = (sequelize, DataTypes) => {
  const ClinicAvailability = sequelize.define('ClinicAvailability', {
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    available_providers: {
      type: DataTypes.INTEGER,
      defaultValue: 0, // Tracks the count of available providers for this slot
    },
  });

  return ClinicAvailability;
};
