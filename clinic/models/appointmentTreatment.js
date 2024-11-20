// models/appointmentTreatment.js
module.exports = (sequelize, DataTypes) => {
    const AppointmentTreatment = sequelize.define('AppointmentTreatment', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      appointmentId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Appointments',
          key: 'appointmentId',
        },
      },
      treatmentId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Treatments',
          key: 'id',
        },
      },
      units: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      involvedTeeth: {
        type: DataTypes.ARRAY(DataTypes.STRING), // e.g., ['11', '12']
        allowNull: true,
      },
      prescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    });
  
    return AppointmentTreatment;
  };
  