function broadcast(wss, message) {
    // Broadcast message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  function handleCustomEvents(wss, event, data) {
    switch (event) {
      case 'APPOINTMENT_UPDATED':
        broadcast(wss, { type: 'APPOINTMENT_UPDATED', data });
        break;
      // Add more events as needed
      default:
        console.log(`Unhandled event: ${event}`);
    }
  }
  
  module.exports = { broadcast, handleCustomEvents };
  