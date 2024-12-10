const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./main/models');  // Import Sequelize models
const { setupAppointmentsWebSocket } = require('./websockets/appointmentsSockets');
const clinicRoutes = require('./clinic/routes/index');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');

dotenv.config();

const app = express();

const corsOptions = {
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);

app.use('/api', clinicRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Dentms API');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;

db.sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    return db.syncMainDatabase();
  })
  .then(() => {
    const wss = new WebSocket.Server({ noServer: true });

    setupAppointmentsWebSocket(wss);

    server.on('upgrade', (request, socket, head) => {
      const { query } = url.parse(request.url, true);
      const subdomain = query.subdomain;

      if (request.url.startsWith('/api/appointment-socket') && subdomain) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          // Attach the subdomain to the WebSocket for later use
          ws.subdomain = subdomain;
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to the database', err);
  });
