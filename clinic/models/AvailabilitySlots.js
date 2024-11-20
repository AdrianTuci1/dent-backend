// models/AvailabilitySlots.js

module.exports = (sequelize, DataTypes) => {
  const AvailabilitySlots = sequelize.define('AvailabilitySlots', {
    medic_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'ClinicUsers', key: 'id' }, // Updated to reference ClinicUsers
    },
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
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  });

  return AvailabilitySlots;
};
