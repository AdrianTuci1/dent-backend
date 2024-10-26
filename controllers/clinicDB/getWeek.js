const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const initializeClinicDatabase = require('../../models/clinicDB');  // Import your initialize function

// Cache the initialized connections to avoid re-initializing for every request
const dbCache = {};

const getClinicDatabase = async (clinicDbName) => {
  if (dbCache[clinicDbName]) {
    return dbCache[clinicDbName];
  }

  const clinicDB = initializeClinicDatabase(clinicDbName);
  dbCache[clinicDbName] = clinicDB;

  return clinicDB;
};


exports.getWeekAppointments = async (req, res) => {
  const { startDate, endDate } = req.body;  // Only extract startDate and endDate from body
  const clinicDbName = req.headers['x-clinic-db'];  // Get clinic database name from headers

  try {
    const db = await getClinicDatabase(clinicDbName);  // Initialize database based on clinicDbName

    const appointments = await db.Appointment.findAll({
      where: {
        date: {
          [Sequelize.Op.gte]: startDate,
          [Sequelize.Op.lte]: endDate,
        },
      },
      include: [
        {
          model: db.ClinicUser,
          as: 'medic', // Include medic details
          attributes: ['id', 'name'],
        },
        {
          model: db.ClinicUser,
          as: 'patient', // Include patient details
          attributes: ['id', 'name'],
        },
        {
          model: db.AppointmentTreatment,
          as: 'AppointmentTreatments', // Use alias for AppointmentTreatment
          include: {
            model: db.Treatment,
            as: 'treatmentDetails', // Fetch treatment details
            attributes: ['name'],
          },
        },
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });
    

    // Format the response to match the expected structure
    const formattedAppointments = appointments.map((appointment) => ({
      appointmentId: appointment.appointmentId,
      date: appointment.date,
      time: appointment.time,
      patientUser: {
        id: appointment.patient.id,
        name: appointment.patient.name,
      },
      medicUser: {
        id: appointment.medic.id,
        name: appointment.medic.name,
      },
      initialTreatment: appointment.AppointmentTreatments[0]?.treatmentDetails?.name || null, // Get the initial treatment
    }));

    res.status(200).json({
      appointments: formattedAppointments,
      message: 'Appointments fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};
