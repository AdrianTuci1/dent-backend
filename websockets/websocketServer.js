const WebSocket = require('ws');

const initWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', (message) => {
      // Handle WebSocket messages
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return wss;
};

module.exports = { initWebSocketServer };
