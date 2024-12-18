const { setAppointments } = require('./appointmentsState');
const { calculateEndHour } = require('../utils/calcultateEndHour');
const { calculateCurrentWeek } = require('../utils/dateUtils');
const { Op } = require('sequelize');
const initializeClinicDatabase = require('../clinic/models');
const updateMissedAppointmentsForSocket = require('../clinic/middleware/updateMissedAppointments')

const databaseCache = {}; // Cache for database connections

/**
 * Get cached database or initialize if not already cached
 * @param {string} subdomain - The subdomain to fetch the database for
 * @returns {Object} - The initialized database models
 */

function getCachedDatabase(subdomain) {
  if (!databaseCache[subdomain]) {
    console.log(`Initializing database for subdomain: ${subdomain}`);
    databaseCache[subdomain] = initializeClinicDatabase(`${subdomain}_db`);
  } else {
    console.log(`Using cached database for subdomain: ${subdomain}`);
  }
  return databaseCache[subdomain];
}

async function handleMessage(ws, message) {
  try {
    const { subdomain } = ws;

    if (!subdomain) {
      console.error('Subdomain is missing in WebSocket connection.');
      ws.send(JSON.stringify({ error: 'Subdomain is required.' }));
      return;
    }

    console.log(`Handling message for subdomain: ${subdomain}`);

    const db = getCachedDatabase(subdomain);

    const { Appointment, ClinicUser, Treatment } = db;


    // Ensure all missed appointments are updated
    await updateMissedAppointmentsForSocket(db);

    // Directly handle "view" since all frontend requests are for viewing data
    await handleViewAppointments(ws, subdomain, Appointment, ClinicUser, Treatment, message);
  } catch (error) {
    console.error(`Error handling message for subdomain ${ws.subdomain}:`, error);
    ws.send(JSON.stringify({ error: 'Failed to process message.' }));
  }
}

async function handleViewAppointments(ws, subdomain, Appointment, ClinicUser, Treatment, message) {
  try {
    const { startDate, endDate, medicId } = JSON.parse(message);

    const currentWeek = await calculateCurrentWeek(subdomain);

    const dateRange = startDate && endDate
      ? { [Op.between]: [startDate, endDate] }
      : { [Op.between]: [currentWeek.startDate, currentWeek.endDate] };

    const appointments = await Appointment.findAll({
      where: {
        date: dateRange,
        ...(medicId && { medicUserId: medicId }),
      },
      include: [
        { model: ClinicUser, as: 'medic', attributes: ['id', 'name'] },
        { model: ClinicUser, as: 'patient', attributes: ['id', 'name'] },
        { model: Treatment, as: 'treatments', attributes: ['name', 'color', 'duration'] },
      ],
    });

    const formattedAppointments = appointments.map((appointment) => ({
      appointmentId: appointment.appointmentId,
      status: appointment.status,
      startHour: appointment.time,
      endHour: calculateEndHour(appointment.time, appointment.treatments),
      date: appointment.date,
      patientId: appointment.patient?.id || null,
      medicId: appointment.medic?.id || null,
      patientUser: appointment.patient?.name || 'Unknown',
      medicUser: appointment.medic?.name || 'Unknown',
      initialTreatment: appointment.treatments[0]?.name || 'No treatment',
      color: appointment.treatments[0]?.color || '#FF5733',
    }));

    setAppointments(subdomain, formattedAppointments);

    ws.send(
      JSON.stringify({
        type: 'appointments',
        action: 'view',
        data: formattedAppointments,
      })
    );
  } catch (error) {
    console.error(`Error fetching appointments for subdomain ${subdomain}:`, error);
    ws.send(JSON.stringify({ error: 'Failed to fetch appointments.' }));
  }
}

module.exports = { handleMessage };