const { connections } = require('./websocket'); // Manages WebSocket connections
const WebSocket = require('ws');

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

module.exports = { broadcastToSubdomain };
