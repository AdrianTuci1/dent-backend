const { Op } = require('sequelize');
const { calculateEndHour } = require('../../utils/calcultateEndHour');



exports.getWeekAppointments = async (req, res) => {
  const { startDate, endDate } = req.body; // Retrieve dates from the request body

  // Validate input
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'startDate and endDate are required in the body.' });
  }


  try {
    const db = req.db;

    // Adjust date range for full-day query
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Querying appointments for:', startOfDay, endOfDay);

    // Fetch appointments for the specified date range
    const appointments = await db.Appointment.findAll({
      where: {
        date: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay,
        },
      },
      include: [
        { model: db.ClinicUser, as: 'medic', attributes: ['name'] },   // Include medic details
        { model: db.ClinicUser, as: 'patient', attributes: ['id', 'name'] }, // Include patient details
        { model: db.Treatment, as: 'treatments', attributes: ['name', 'color', 'duration'] }, // Include treatment details
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for the given date range.' });
    }

    // Format the results
    const formattedAppointments = appointments.map((appointment) => ({
      appointmentId: appointment.appointmentId,
      status: appointment.status,
      date: appointment.date,
      time: appointment.time,
      patientId: appointment.patient.id,
      patientUser: appointment.patient.name,
      medicUser: appointment.medic.name,
      initialTreatment: appointment.treatments[0]?.name || 'No treatment', // First treatment, if exists
      color: appointment.treatments[0]?.color || '#FF5733',  // Use default color if none provided
      startHour: appointment.time,
      endHour: calculateEndHour(appointment.time, appointment.treatments),
    }));

    res.status(200).json({
      appointments: formattedAppointments,
      message: 'Appointments fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching appointments:', error.message);
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};