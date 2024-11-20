const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
const db = require('../models');  // Central database models (users, clinics)

// Create a new clinic and set up the database
const createClinic = async (req, res) => {
  const { name, username, password, subdomain, subaccountPin } = req.body;

  try {
    // 1. Hash the password and PIN (if provided)
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = subaccountPin ? await bcrypt.hash(subaccountPin, 10) : null;

    // 2. Create a unique database name and sanitize it
    const dbName = `${subdomain.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_db`;

    // Connect to the main PostgreSQL server as a superuser
    const rootSequelize = new Sequelize(process.env.DATABASE_URL);  // Main DB connection as superuser

    // 3. Check if the database already exists, if not, create it
    await rootSequelize.query(`SELECT 1 FROM pg_database WHERE datname = '${dbName}'`).then(async ([results]) => {
      if (results.length === 0) {
        await rootSequelize.query(`CREATE DATABASE ${dbName}`);
        console.log(`Database ${dbName} created successfully!`);
      } else {
        throw new Error(`Database ${dbName} already exists`);
      }
    });

    // 4. Add the clinic to the central `clinics` table with username and hashed password
    const clinic = await db.Clinic.create({
      name,
      subdomain,
      username,
      password: hashedPassword,
      db_name: dbName,
      created_by: req.user.id,  // Assuming req.user contains the admin user
    });

    // 5. Set up the clinic's new database and add the main admin account and subaccount
    const clinicSequelize = new Sequelize(`postgres://admin:admin@localhost:5432/${dbName}`);

    // Create the `users` table for the clinic
    await clinicSequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        pin VARCHAR(255),  -- Optional PIN for subaccount protection
        subaccount_of INT REFERENCES users(id) ON DELETE SET NULL  -- Subaccount reference to another user
      );
    `);

    // Insert the main admin account into the clinic's `users` table
    const [admin] = await clinicSequelize.query(`
      INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id;
    `, {
      bind: [username, hashedPassword, 'admin']
    });

    // Insert the admin subaccount with a PIN (if provided)
    if (hashedPin) {
      await clinicSequelize.query(`
        INSERT INTO users (email, password, role, pin, subaccount_of)
        VALUES ('admin', $1, 'admin', $2, $3);
      `, {
        bind: [hashedPassword, hashedPin, admin[0].id]
      });
    } else {
      await clinicSequelize.query(`
        INSERT INTO users (email, password, role, subaccount_of)
        VALUES ('admin', $1, 'admin', $2);
      `, {
        bind: [hashedPassword, admin[0].id]
      });
    }

    res.status(201).json({ message: 'Clinic, admin, and subaccount created successfully with optional PIN!' });
  } catch (error) {
    console.error('Error creating clinic:', error.message || error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createClinic };
