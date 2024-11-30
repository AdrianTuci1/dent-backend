const { Op } = require('sequelize');  // Import Op directly from Sequelize

const updateMissedAppointments = async (req, res, next) => {
  
    try {
      // Get the clinic-specific database connection
      const db = req.db;
  
      // Get the current date and time
      const currentDateTime = new Date();
  
      // Find appointments that are past their date and time, are not done, and still marked as upcoming
      const missedAppointments = await db.Appointment.findAll({
        where: {
          status: 'upcoming',
          isDone: false,
          date: { [Op.lt]: currentDateTime.toISOString().split('T')[0] }, // Past date
          time: { [Op.lt]: currentDateTime.toTimeString().split(' ')[0] }, // Past time
        },
      });
  
      // Update the status of each missed appointment
      for (const appointment of missedAppointments) {
        appointment.status = 'missed';
        await appointment.save();
      }
  
      // Log the number of updated appointments
      console.log(`Updated ${missedAppointments.length} appointments to 'missed'.`);
  
      next(); // Proceed to the next middleware or controller
    } catch (error) {
      console.error('Error updating missed appointments:', error);
      res.status(500).json({ message: 'Error updating missed appointments', error: error.message });
    }
  };
  

  module.exports = updateMissedAppointments;