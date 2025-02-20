const { connections } = require('./websocket'); // Manages WebSocket connections
const WebSocket = require('ws');

function broadcastToSubdomain(subdomain, message) {
  console.log(`📡 Broadcasting to subdomain: ${subdomain}`);

  const clientSet = connections.get(subdomain);
  if (!clientSet) {
    console.warn(`⚠️ No active WebSocket connections for subdomain: ${subdomain}`);
    return;
  }

  console.log(`✅ Found ${clientSet.size} connections for subdomain: ${subdomain}`);

  const messageString = JSON.stringify(message);
  for (const client of clientSet) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  }
}

module.exports = { broadcastToSubdomain };
