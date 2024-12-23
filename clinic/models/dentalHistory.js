module.exports = (sequelize, DataTypes) => {
  const DentalHistory = sequelize.define('DentalHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Patients', // Ensures the relationship with the Patients table
        key: 'id',
      },
    },
    toothNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    condition: {
      type: DataTypes.STRING, // Example: 'sound', 'cavity', 'extracted', etc.
      allowNull: false,
      defaultValue: 'sound',
    },
    history: {
      type: DataTypes.JSONB, // Store detailed history as structured data
      allowNull: true,
      defaultValue: [],
    },
  });

  // Define associations if needed
  DentalHistory.associate = (models) => {
    DentalHistory.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  };

  return DentalHistory;
};
