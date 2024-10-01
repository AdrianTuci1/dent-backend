const WebSocket = require('ws');
const Sequelize = require('sequelize'); // Make sure Sequelize is required
const initializeClinicDatabase = require('../models/clinicDB'); // Assuming this initializes the correct database

function setupAppointmentsWebSocket(wss) {
  // Handle WebSocket upgrade manually for path '/api/appointment-socket'
  wss.on('connection', (ws, req) => {
    if (req.url === '/api/appointment-socket') {
      console.log('New client connected to /api/appointment-socket');

      // Handle incoming messages
      ws.on('message', async (message) => {
        try {
          const { startDate, endDate, clinicDatabase, medicUserId } = JSON.parse(message);
          console.log(`Received data: startDate=${startDate}, endDate=${endDate}, medicUserId=${medicUserId}, clinicDatabase=${clinicDatabase}`);

          // Initialize clinic database dynamically
          const { Appointment, ClinicUser, Treatment } = initializeClinicDatabase(clinicDatabase);

          // Fetch appointments based on incoming data
          const appointments = await Appointment.findAll({
            where: {
              date: {
                [Sequelize.Op.between]: [startDate, endDate],
              },
              ...(medicUserId && { medicUserId }), // Add medicUserId if present
            },
            include: [
              { model: ClinicUser, as: 'medic', attributes: ['name'] },
              { model: ClinicUser, as: 'patient', attributes: ['name'] },
              { model: Treatment, as: 'treatments' },
            ],
          });

          // Send appointments back to the client
          appointments.forEach((appointment) => {
            const response = {
              id: appointment.appointmentId,
              status: appointment.status,
              treatmentName: appointment.treatments[0]?.name || 'No treatment',
              startHour: appointment.time,
              endHour: calculateEndHour(appointment.time, appointment.treatments),
              date: appointment.date,
              patientName: appointment.patient?.name || 'Unknown',
              medicName: appointment.medic?.name || 'Unknown',
            };
            ws.send(JSON.stringify(response));
          });
        } catch (error) {
          console.error('Error processing appointment request:', error);
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

// Helper function to calculate endHour based on treatment duration
const calculateEndHour = (startTime, treatments) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = treatments.reduce((sum, treatment) => sum + (treatment.duration || 0), 0);
  const endMinutes = hours * 60 + minutes + totalMinutes;
  const endHour = Math.floor(endMinutes / 60).toString().padStart(2, '0');
  const endMinute = (endMinutes % 60).toString().padStart(2, '0');
  return `${endHour}:${endMinute}`;
};

module.exports = setupAppointmentsWebSocket;
