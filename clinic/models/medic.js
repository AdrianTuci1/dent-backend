// models/medic.js
module.exports = (sequelize, DataTypes) => {
  const Medic = sequelize.define('Medic', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'ClinicUsers',
        key: 'id',
      },
    },
    employmentType: {
      type: DataTypes.ENUM('full-time', 'part-time', 'contract'),
      allowNull: false,
    },
    specialization: {
      type: DataTypes.STRING, // e.g., 'Dentist', 'Orthodontist'
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    assignedTreatments: {
      type: DataTypes.ARRAY(DataTypes.STRING), // List of Treatment IDs or names
      allowNull: true,
    },
  });

  return Medic;
};
