const { Op } = require('sequelize');

const generateAppointmentId = async (db) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear().toString().slice(-2); // Get last two digits of the year
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Get two-digit month

  const prefix = `AP${year}${month}`; // Build the prefix

  // Find the latest appointment ID for the current year and month
  const lastAppointment = await db.Appointment.findOne({
    where: {
      appointmentId: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['appointmentId', 'DESC']],
  });

  // Extract the sequential number and increment it
  const lastSequence = lastAppointment
    ? parseInt(lastAppointment.appointmentId.slice(-6), 10)
    : 0;

  const nextSequence = lastSequence + 1;
  const nextSequenceStr = nextSequence.toString().padStart(6, '0'); // Ensure 6 digits

  return `${prefix}${nextSequenceStr}`; // Combine all parts
};

module.exports = { generateAppointmentId }
