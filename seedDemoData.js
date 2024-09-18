const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const { User, Clinic, syncMainDatabase } = require('./models/mainDB');  // Main database models and sync function
const initializeClinicDatabase = require('./models/clinicDB');  // Clinic-specific DB handler

const seedDemoData = async () => {
  try {
    // 1. Sync the main database first (users, clinics)
    await syncMainDatabase();
    console.log('Main database synced successfully.');

    // 2. Create a demo user in the main database
    const hashedPassword = await bcrypt.hash('password', 10);
    const user = await User.create({
      email: 'demo@dentms.ro',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Main user created:', user);

    // 3. Create a demo clinic in the main database
    const demoClinic = await Clinic.create({
      name: 'Demo Clinic',
      subdomain: 'demo.dentms.ro',
      planId: 1,
      username: 'demo',
      password: hashedPassword,
    });
    console.log('Demo clinic created:', demoClinic);

    // 4. Check if the demo_db exists and create it if not
    const rootSequelize = new Sequelize('postgres://admin:admin@postgres:5432/postgres');

    // Query to check if demo_db exists
    const [results] = await rootSequelize.query(`SELECT 1 FROM pg_database WHERE datname = 'demo_db'`);

    if (results.length === 0) {
      await rootSequelize.query('CREATE DATABASE demo_db');
      console.log('Database demo_db created successfully.');
    } else {
      console.log('Database demo_db already exists.');
    }

    // 5. Initialize the demo clinic database and sync it
    const { clinicSequelize, ClinicUser, syncClinicDatabase } = initializeClinicDatabase('demo_db');
    await syncClinicDatabase();  // Sync only clinic-specific models
    console.log('Demo clinic database synced successfully.');

    // 6. Insert admin user into demo_db
    const admin = await ClinicUser.create({
      email: 'demo',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Admin user created in demo_db:', admin);

    // 7. Insert subaccount with a PIN for the admin user
    const hashedPin = await bcrypt.hash('0000', 10);
    await ClinicUser.create({
      email: 'admin',
      password: hashedPassword,
      role: 'admin',
      pin: hashedPin,
      subaccount_of: admin.id,
    });
    console.log('Subaccount created for admin with PIN in demo_db.');

    console.log('Demo data seeded successfully');
  } catch (error) {
    console.error('Error seeding demo data:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

seedDemoData();
