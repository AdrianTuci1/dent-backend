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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    employmentType: {
      type: DataTypes.ENUM('full-time', 'part-time', 'contract'),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING, // e.g., 'Dentist', 'Orthodontist'
      allowNull: false,
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
    assignedTreatments: {
      type: DataTypes.ARRAY(DataTypes.STRING), // List of Treatment IDs or names
      allowNull: true,
    },
    workingDaysHours: {
      type: DataTypes.JSON, // e.g., { Mon: '9am-5pm', Tue: '9am-5pm' }
      allowNull: true,
    },
    daysOff: {
      type: DataTypes.ARRAY(DataTypes.STRING), // e.g., ['Saturday', 'Sunday']
      allowNull: true,
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  });

  return Medic;
};
