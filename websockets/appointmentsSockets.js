const WebSocket = require('ws');
const Sequelize = require('sequelize');
const initializeClinicDatabase = require('../models/clinicDB'); // Assuming this initializes the correct database
const { calculateCurrentWeek } = require('../utils/dateUtils'); // Helper to calculate current week based on timezone

function setupAppointmentsWebSocket(wss) {
  // Handle WebSocket upgrade manually for path '/api/appointment-socket'
  wss.on('connection', (ws, req) => {
    if (req.url.startsWith('/api/appointment-socket')) {
      console.log('New client connected to /api/appointment-socket');

      // Handle incoming messages from client
      ws.on('message', async (message) => {
        try {
          const { subdomain, medicUserId } = JSON.parse(message); // Receive subdomain and optionally medicUserId
          console.log(`Received request: subdomain=${subdomain}, medicUserId=${medicUserId}`);

          // Initialize the clinic database based on the subdomain
          const { Appointment, ClinicUser, Treatment } = initializeClinicDatabase(`${subdomain}_db`);

          // Calculate current week for the clinic based on the timezone stored in clinics table
          const currentWeek = await calculateCurrentWeek(subdomain);

          // Fetch appointments for the current week based on the clinic's subdomain and optional medicUserId
          const appointments = await Appointment.findAll({
            where: {
              date: {
                [Sequelize.Op.between]: [currentWeek.startDate, currentWeek.endDate],
              },
              ...(medicUserId && { medicUserId }), // Only add medicUserId condition if it's provided
            },
            include: [
              { model: ClinicUser, as: 'medic', attributes: ['name'] },   // Include medic details
              { model: ClinicUser, as: 'patient', attributes: ['name'] }, // Include patient details
              { model: Treatment, as: 'treatments', attributes: ['name', 'color', 'duration'] }, // Include treatment details
            ],
          });

          // Send each appointment back to the client via WebSocket
          appointments.forEach((appointment) => {
            const response = {
              appointmentId: appointment.appointmentId,
              status: appointment.status,
              initialTreatment: appointment.treatments[0]?.name || 'No treatment', // First treatment, if exists
              color: appointment.treatments[0]?.color || '#FF5733',  // Use default color if none provided
              startHour: appointment.time,
              endHour: calculateEndHour(appointment.time, appointment.treatments),
              date: appointment.date,
              patientUser: appointment.patient?.name || 'Unknown',  // Fallback if patient name is missing
              medicUser: appointment.medic?.name || 'Unknown',      // Fallback if medic name is missing
            };
            ws.send(JSON.stringify(response));
          });
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          ws.send(JSON.stringify({ error: 'Failed to fetch appointments' }));
        }
      });

      // Handle WebSocket disconnection
      ws.on('close', () => {
        console.log('Client disconnected from /api/appointment-socket');
      });

      // Handle WebSocket errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }
  });
}

// Helper function to calculate endHour based on treatment durations
const calculateEndHour = (startTime, treatments) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = treatments.reduce((sum, treatment) => sum + (treatment.duration || 0), 0);
  const endMinutes = hours * 60 + minutes + totalMinutes;
  const endHour = Math.floor(endMinutes / 60).toString().padStart(2, '0');
  const endMinute = (endMinutes % 60).toString().padStart(2, '0');
  return `${endHour}:${endMinute}`;
};

module.exports = setupAppointmentsWebSocket;
