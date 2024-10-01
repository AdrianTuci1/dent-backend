const { Op } = require('sequelize');
const { Appointment, ClinicUser, Treatment } = require('../models/clinicDB');

// Fetch appointments within a specific week and filter by medic
const getAppointments = async (req, res) => {
  const { startDate, endDate, medicUserId } = req.query;

  try {
    // Define a date range and medic filter
    const whereCondition = {};
    if (startDate && endDate) {
      whereCondition.date = {
        [Op.between]: [startDate, endDate],
      };
    }
    if (medicUserId) {
      whereCondition.medicUser = medicUserId;  // Filter by specific medic
    }

    const appointments = await Appointment.findAll({
      where: whereCondition,
      include: [
        { model: ClinicUser, as: 'medic', attributes: ['name'] },
        { model: ClinicUser, as: 'patient', attributes: ['name'] },
        {
          model: Treatment,
          as: 'treatments',
          through: { attributes: [] },  // Exclude intermediate table data
        },
      ],
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

module.exports = {
  getAppointments,
  createAppointment,
};
