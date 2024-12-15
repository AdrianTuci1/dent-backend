const { Op, Sequelize } = require('sequelize');

const updateMissedAppointmentsForSocket = async (db) => {
  try {
    // Get the current date and time
    const currentDateTime = new Date();

    // Find appointments that are past their combined date and time, are not done, and still marked as upcoming
    const missedAppointments = await db.Appointment.findAll({
      where: {
        status: 'upcoming',
        isDone: false,
        [Op.and]: [
          Sequelize.literal(
            `("date"::date + "time"::time) < '${currentDateTime.toISOString()}'`
          ),
        ],
      },
    });

    // Update the status of each missed appointment
    for (const appointment of missedAppointments) {
      appointment.status = 'missed';
      await appointment.save();
    }

    // Log the number of updated appointments
    console.log(`Updated ${missedAppointments.length} appointments to 'missed'.`);

    // Optionally return the updated appointments
    return missedAppointments;
  } catch (error) {
    console.error('Error updating missed appointments:', error);
    throw error; // Propagate the error for the caller to handle
  }
};

module.exports = updateMissedAppointmentsForSocket;
