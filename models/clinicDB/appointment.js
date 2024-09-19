const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date: {
      type: DataTypes.DATEONLY, // Stores only the date
      allowNull: false,
    },
    startHour: {
      type: DataTypes.TIME, // Stores the start time of the appointment
      allowNull: false,
    },
    endHour: {
      type: DataTypes.TIME, // Stores the end time of the appointment
      allowNull: false,
    },
    medicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clinic_users', // References the medics table
        key: 'id',
      },
      onDelete: 'CASCADE', // Delete appointment if the medic is deleted
    },
    medicName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients', // References the patients table
        key: 'id',
      },
      onDelete: 'CASCADE', // Delete appointment if the patient is deleted
    },
    patientName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT, // Optional additional details
      allowNull: true,
    },
    treatment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    involvedTeeth: {
      type: DataTypes.ARRAY(DataTypes.STRING), // Stores multiple involved teeth as an array of strings
      allowNull: true,
    },
    prescription: {
      type: DataTypes.TEXT, // Stores the prescription if any
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT, // Stores the price of the treatment
      allowNull: false,
    },
    paid: {
      type: DataTypes.BOOLEAN, // Indicates if payment has been made
      defaultValue: false,
    },
  }, {
    tableName: 'appointments',  // Explicitly set the table name
  });

  return Appointment;
};
