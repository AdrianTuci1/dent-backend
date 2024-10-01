const WebSocket = require('ws');

// Initialize WebSocket server
function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    // Optionally handle global WebSocket logic
    ws.on('message', (message) => {
      console.log('Message received:', message);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;  // Return WebSocket server instance for additional usage
}

module.exports = setupWebSocketServer;
