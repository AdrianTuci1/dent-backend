const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const { User, Clinic, syncMainDatabase } = require('./models/mainDB');  // Main database models and sync function
const initializeClinicDatabase = require('./models/clinicDB');  // Clinic-specific DB handler

const createAdminAndMedic = require('./seedData/createAdminAndMedic');
const createPatients = require('./seedData/createPatients');
const createComponents = require('./seedData/createComponents');
const createTreatments = require('./seedData/createTreatments');
const createAppointments = require('./seedData/createAppointments');

const seedDemoData = async () => {
  try {
    // Sync the main database first (users, clinics)
    await syncMainDatabase();
    console.log('Main database synced successfully.');

    // Create demo user and clinic (check if they exist to avoid duplication)
    const existingUser = await User.findOne({ where: { email: 'demo@dentms.ro' } });
    const existingClinic = await Clinic.findOne({ where: { subdomain: 'demo.dentms.ro' } });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash('password', 10);

      const user = await User.create({
        email: 'demo@dentms.ro',
        name: 'Demo Admin',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Main user created:', user.toJSON());
    } else {
      console.log('Main user already exists:', existingUser.toJSON());
    }

    if (!existingClinic) {
      const hashedClinicPassword = await bcrypt.hash('password', 10);

      const demoClinic = await Clinic.create({
        name: 'Demo Clinic',
        subdomain: 'demo.dentms.ro',
        planId: 1,
        username: 'demo',
        password: hashedClinicPassword,
      });
      console.log('Demo clinic created:', demoClinic.toJSON());
    } else {
      console.log('Demo clinic already exists:', existingClinic.toJSON());
    }

    // Check if demo_db exists and create it if not
    const rootSequelize = new Sequelize('postgres://admin:admin@postgres:5432/postgres', {
      logging: false,
    });

    const [results] = await rootSequelize.query(`SELECT 1 FROM pg_database WHERE datname = 'demo_db'`);
    if (results.length === 0) {
      await rootSequelize.query('CREATE DATABASE demo_db');
      console.log('Database demo_db created successfully.');
    } else {
      console.log('Database demo_db already exists.');
    }

    // Initialize and sync the demo clinic database
    const {
      ClinicUser,
      Appointment,
      Patient,
      Medic,
      Treatment,
      Component,
      AppointmentTreatment, // Include AppointmentTreatment
      Permission,
      ClinicUserPermission,
      WorkingDaysHours,
      DaysOff,
      syncClinicDatabase,
    } = initializeClinicDatabase('demo_db');

    await syncClinicDatabase(); // Sync clinic-specific models
    console.log('Demo clinic database synced successfully.');

    // Check if admin user already exists in demo_db
    const existingAdmin = await ClinicUser.findOne({ where: { email: 'admin@demo.dentms.ro' } });
    if (!existingAdmin) {
      // Start a transaction
      const transaction = await ClinicUser.sequelize.transaction();
      try {
        const models = {
          ClinicUser,
          Appointment,
          Patient,
          Medic,
          Treatment,
          Component,
          AppointmentTreatment,
          Permission,
          ClinicUserPermission,
          WorkingDaysHours,
          DaysOff,
        };

        const { medicUser } = await createAdminAndMedic(models, transaction);
        const patientUser = await createPatients(models, transaction);
        const component = await createComponents(models, transaction);
        const treatment = await createTreatments(models, component, transaction);
        await createAppointments(models, patientUser, medicUser, treatment, transaction);
    
        await transaction.commit();
        console.log('Demo data seeded successfully.');
      } catch (error) {
        // Rollback the transaction in case of any errors
        await transaction.rollback();
        console.error('Error during transaction:', error);
      }
    } else {
      console.log('Admin user already exists in demo_db. Skipping demo data seeding.');
    }
  } catch (error) {
    console.error('Error seeding demo data:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

seedDemoData();
