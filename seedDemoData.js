const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const { User, Clinic, syncMainDatabase } = require('./models/mainDB');  // Main database models and sync function
const initializeClinicDatabase = require('./models/clinicDB');  // Clinic-specific DB handler

const seedDemoData = async () => {
  try {
    // Sync the main database first (users, clinics)
    await syncMainDatabase();
    console.log('Main database synced successfully.');

    // Create demo user and clinic (check if they exist to avoid duplication)
    const existingUser = await User.findOne({ where: { email: 'demo@dentms.ro' } });
    const existingClinic = await Clinic.findOne({ where: { subdomain: 'demo.dentms.ro' } });

    if (!existingUser || !existingClinic) {
      const hashedPassword = await bcrypt.hash('password', 10);

      const user = await User.create({
        email: 'demo@dentms.ro',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Main user created:', user);

      const demoClinic = await Clinic.create({
        name: 'Demo Clinic',
        subdomain: 'demo.dentms.ro',
        planId: 1,
        username: 'demo',
        password: hashedPassword,
      });
      console.log('Demo clinic created:', demoClinic);
    }

    // Check if demo_db exists and create it if not
    const rootSequelize = new Sequelize('postgres://admin:admin@postgres:5432/postgres');

    const [results] = await rootSequelize.query(`SELECT 1 FROM pg_database WHERE datname = 'demo_db'`);
    if (results.length === 0) {
      await rootSequelize.query('CREATE DATABASE demo_db');
      console.log('Database demo_db created successfully.');
    } else {
      console.log('Database demo_db already exists.');
    }

    // Initialize and sync the demo clinic database
    const { ClinicUser, Appointment, Patient, Treatment, Component, syncClinicDatabase } = initializeClinicDatabase('demo_db');
    await syncClinicDatabase();  // Sync clinic-specific models to ensure the tables are created
    console.log('Demo clinic database synced successfully.');

    // Check if the admin user already exists in demo_db
    const existingAdmin = await ClinicUser.findOne({ where: { email: 'demo' } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('password', 10);

      const admin = await ClinicUser.create({
        email: 'demo',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Admin user created in demo_db:', admin);

      // Create subaccounts
      const hashedPin = await bcrypt.hash('0000', 10);
      await ClinicUser.create({
        email: 'admin',
        password: hashedPassword,
        role: 'admin',
        pin: hashedPin,
        subaccount_of: admin.id,
      });
      console.log('Subaccount created for admin in demo_db.');

      // Create medic subaccount
      const medic = await ClinicUser.create({
        email: 'medic@demo.dentms.ro',
        password: hashedPassword,
        role: 'medic',
        employmentType: 'full-time',
        specialization: 'Dentist',
        pin: await bcrypt.hash('1234', 10),
        subaccount_of: admin.id,
      });
      console.log('Medic subaccount created in demo_db:', medic);

      // Create patient subaccount
      const patient = await Patient.create({
        name: 'John Doe',
        email: 'patient@demo.dentms.ro',
        password: hashedPassword,
      });
      console.log('Patient subaccount created in demo_db:', patient);

      // Create treatment
      const treatment = await Treatment.create({
        code: 'T001',
        name: 'Teeth Cleaning',
        description: 'Basic teeth cleaning service',
        duration: 30,
        price: 100.0,
      });
      console.log('Treatment created:', treatment);

      // Create component for the treatment
      const component = await Component.create({
        code: 'C001',
        name: 'Cleaning Kit',
        price: 20.0,
      });
      console.log('Component created:', component);

      // Create an appointment for the patient with the medic
      const appointment = await Appointment.create({
        date: new Date(),
        startHour: '10:00:00',
        endHour: '10:30:00',
        medicId: medic.id,
        patientId: patient.id,
        details: 'Teeth cleaning appointment',
        price: 100.0,
        paid: false,
      });
      console.log('Appointment created:', appointment);

      console.log('Demo data seeded successfully.');
    } else {
      console.log('Admin user already exists in demo_db. Skipping demo data seeding.');
    }

  } catch (error) {
    console.error('Error seeding demo data:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

seedDemoData();
