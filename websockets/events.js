function handleCustomEvents(wss, clients) {
  const broadcastToSubdomain = (subdomain, event) => {
    if (clients.has(subdomain)) {
      clients.get(subdomain).forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(event));
        }
      });
    }
  };

  // Create Appointment Event
  wss.on('createAppointment', (subdomain, appointment) => {
    broadcastToSubdomain(subdomain, {
      type: 'createAppointment',
      data: appointment,
    });
  });

  // Edit Appointment Event
  wss.on('editAppointment', (subdomain, appointment) => {
    broadcastToSubdomain(subdomain, {
      type: 'editAppointment',
      data: appointment,
    });
  });

  // Delete Appointment Event
  wss.on('deleteAppointment', (subdomain, appointmentId) => {
    broadcastToSubdomain(subdomain, {
      type: 'deleteAppointment',
      data: { appointmentId },
    });
  });
}

module.exports = { handleCustomEvents };
