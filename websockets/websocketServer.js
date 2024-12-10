const { WebSocketServer } = require('ws');

let wss = null;

const getWebSocketServer = () => wss;

const WebSocket = require('ws');

function setupWebSocketServer(httpServer) {
  // Attach WebSocket server to existing HTTP server
  const wss = new WebSocket.Server({ server: httpServer });

  console.log('WebSocket server initialized');

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', (message) => {
      console.log('Received WebSocket message:', message);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}


module.exports = { setupWebSocketServer, getWebSocketServer };
