const WebSocket = require('ws');
const { Op } = require('sequelize');
const initializeClinicDatabase = require('../clinic/models');
const { calculateCurrentWeek } = require('../utils/dateUtils');
const { calculateEndHour } = require('../utils/calcultateEndHour');

const connections = new Map();

function setupAppointmentsWebSocket(wss) {
  if (!wss) {
    throw new Error('WebSocket server instance is undefined');
  }

  wss.on('connection', (ws) => {
    const subdomain = ws.subdomain;

    if (!subdomain) {
      ws.close(1008, 'Subdomain is required');
      return;
    }

    console.log(`New WebSocket connection for subdomain: ${subdomain}`);

    // Manage connections grouped by subdomain
    if (!connections.has(subdomain)) {
      connections.set(subdomain, new Set());
    }
    connections.get(subdomain).add(ws);
    ws.on('message', async (message) => {
      try {
        const { medicId, startDate, endDate } = JSON.parse(message);

        if (!subdomain) {
          ws.send(JSON.stringify({ error: 'Subdomain is required' }));
          return;
        }

        console.log(`Received request: subdomain=${subdomain}, medicId=${medicId}, startDate=${startDate}, endDate=${endDate}`);

        // Add connection to subdomain group
        if (!connections.has(subdomain)) {
          connections.set(subdomain, new Set());
        }
        connections.get(subdomain).add(ws);

        const { Appointment, ClinicUser, Treatment } = initializeClinicDatabase(`${subdomain}_db`);

        const currentWeek = await calculateCurrentWeek(subdomain);

        // Determine the date range
        const dateRange = startDate && endDate
          ? { [Op.between]: [startDate, endDate] }
          : { [Op.between]: [currentWeek.startDate, currentWeek.endDate] };

        // Fetch appointments
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

        // Send all appointments as a bulk viewAppointments message
        const response = {
          type: 'viewAppointments',
          data: appointments.map((appointment) => ({
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
          })),
        };
        ws.send(JSON.stringify(response));
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({ error: 'Failed to process request' }));
      }
    });

    ws.on('close', () => {
      console.log(`Client disconnected`);
      connections.forEach((clientSet, subdomain) => {
        clientSet.delete(ws);
        if (clientSet.size === 0) {
          connections.delete(subdomain);
        }
      });
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
}

// Broadcast function for live updates
function broadcastToSubdomain(subdomain, message) {
  const clientSet = connections.get(subdomain);
  if (!clientSet) {
    console.warn(`No active connections for subdomain: ${subdomain}`);
    return;
  }

  const messageString = JSON.stringify(message);

  for (const client of clientSet) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  }
}

module.exports = {
  setupAppointmentsWebSocket,
  broadcastToSubdomain,
};
