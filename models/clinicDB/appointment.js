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
    initialAppointment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,  // Indicates if this is the initial appointment
    },
    medicUser: {  // Reference to the ClinicUser acting as the medic
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ClinicUsers', // ClinicUser table
        key: 'id',
      },
    },
    patientUser: {  // Reference to the ClinicUser acting as the patient
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ClinicUsers', // ClinicUser table
        key: 'id',
      },
    },
  });

  return Appointment;
};
