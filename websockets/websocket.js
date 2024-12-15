
const { handleMessage } = require('./messageHandlers');
const connections = new Map();

function setupAppointmentsWebSocket(wss) {
  wss.on('connection', (ws) => {
    const { subdomain } = ws;

    if (!subdomain) {
      ws.close(1008, 'Subdomain is required');
      return;
    }

    console.log(`New WebSocket connection for subdomain: ${subdomain}`);

    // Add the connection to the subdomain's client set
    if (!connections.has(subdomain)) {
      connections.set(subdomain, new Set());
    }
    connections.get(subdomain).add(ws);

    // Handle incoming messages
    ws.on('message', (message) => {
      handleMessage(ws, message);
    });

    // Handle WebSocket closure
    ws.on('close', () => {
      console.log(`WebSocket closed for subdomain: ${subdomain}`);
      const clientSet = connections.get(subdomain);
      clientSet?.delete(ws);
      if (clientSet?.size === 0) {
        connections.delete(subdomain);
      }
    });
  });
}

module.exports = { setupAppointmentsWebSocket, connections };
