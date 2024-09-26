// models/dentalHistory.js
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
          model: 'Patients',
          key: 'id',
        },
      },
      toothNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      treatments: {
        type: DataTypes.ARRAY(DataTypes.STRING), // List of Treatment IDs
        allowNull: true,
      },
    });
  
    return DentalHistory;
  };
  