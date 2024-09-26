// models/appointment.js
module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    appointmentId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY, // Format: 'YYYY-MM-DD'
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING, // Format: 'HH:MM'
      allowNull: false,
    },
    isDone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('done', 'upcoming', 'missed', 'not-paid'),
      allowNull: false,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Patients',
        key: 'id',
      },
    },
    medicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Medics',
        key: 'id',
      },
    },
  });

  return Appointment;
};
