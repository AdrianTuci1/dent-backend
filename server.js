const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const db = require('./main/models');  // Import Sequelize models


const authRoutes = require('./clinic/routes/authRoutes');  // Import routes
const clinicRoutes = require('./main/routes/clinicRoutes');
const treatmentRoutes = require('./clinic/routes/treatmentRoutes');
const componentRoutes = require('./clinic/routes/componentRoutes');
const appointmentRoutes = require('./clinic/routes/appointmentRoutes');
const categoryRoutes = require('./clinic/routes/categoryRoutes');

const medicRoutes = require('./clinic/routes/medicRoutes');
const patientRoutes = require('./clinic/routes/patientRoutes');

const searchRoutes = require('./clinic/routes/searchRoutes');
const requestsRoutes = require('./clinic/routes/requestAppointmentRoutes');

const http = require('http');
const WebSocket = require('ws');
const setupAppointmentsWebSocket = require('./websockets/appointmentsSockets');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Use CORS middleware (apply to all routes by default)
const corsOptions = {
  origin: ['http://localhost:5173'], // Adjust as needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allowed methods
  credentials: true,  // If using cookies or authentication headers
};
app.use(cors(corsOptions));

// Middleware to parse JSON requests
app.use(express.json());

const server = http.createServer(app);

// Define routes
app.use('/api/auth', authRoutes);         // Authentication routes
app.use('/api/clinic', clinicRoutes);     // Protected clinic routes
app.use('/api/treatments', treatmentRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/category', categoryRoutes);

app.use('/api/medics', medicRoutes);
app.use('/api/patients', patientRoutes);

app.use('/api/search', searchRoutes);
app.use('/api/requests', requestsRoutes);

// Home route for testing
app.get('/', (req, res) => {
  res.send('Welcome to the Dentms API');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Connect to the PostgreSQL database, sync models, and start the server
const PORT = process.env.PORT || 3000;

db.sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully');
    
    // Sync the database models
    return db.syncMainDatabase();  // Ensure this syncs the database properly
  })
  .then(() => {
    // Web Sockets - Initialize the WebSocket server after database is ready
    const wss = new WebSocket.Server({ noServer: true });

    // Handle WebSocket upgrades only for the appointment socket path
    server.on('upgrade', (request, socket, head) => {
      if (request.url === '/api/appointment-socket') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();  // Destroy any connection that does not match the WebSocket path
      }
    });

    // Set up WebSocket for appointments
    setupAppointmentsWebSocket(wss);

    // Start the HTTP server after WebSocket is set up
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to the database', err);
  });
