const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');  // Import the cors package
const db = require('./models/mainDB');  // Import Sequelize models
const authRoutes = require('./routes/authRoutes');  // Import routes
const clinicRoutes = require('./routes/clinicRoutes');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Use CORS middleware (apply to all routes by default)
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Define routes
app.use('/api/auth', authRoutes);         // Authentication routes
app.use('/api/clinic', clinicRoutes); // Protected clinic routes

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
    return db.syncMainDatabase();  // Make sure this is called before starting the server
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error connecting to the database', err);
  });
