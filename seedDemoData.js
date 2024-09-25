// seedDemoData.js

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
        // Hash passwords
        const hashedPassword = await bcrypt.hash('password', 10);
        const hashedPinAdmin = await bcrypt.hash('0000', 10);
        const hashedPinMedic = await bcrypt.hash('1234', 10);

        // Create Admin ClinicUser
        const adminUser = await ClinicUser.create({
          email: 'admin@demo.dentms.ro',
          name: 'Demo Admin',
          password: hashedPassword,
          role: 'admin',
          subaccount_of: null,
          permissions: {
            allAppointments: true,
            statisticsVisible: true,
            canAddTreatments: true,
            canEditStocks: true,
          },
          photo: 'path/to/admin_photo.jpg', // Optional
        }, { transaction });
        console.log('Admin user created:', adminUser.toJSON());

        // Create Admin Subaccount
        const adminSubaccount = await ClinicUser.create({
          email: 'admin_sub@demo.dentms.ro',
          name: 'Admin Subaccount',
          password: hashedPassword,
          role: 'admin',
          pin: hashedPinAdmin,
          subaccount_of: adminUser.id,
          permissions: {
            allAppointments: true,
            statisticsVisible: true,
            canAddTreatments: true,
            canEditStocks: true,
          },
          photo: 'path/to/admin_sub_photo.jpg', // Optional
        }, { transaction });
        console.log('Admin subaccount created:', adminSubaccount.toJSON());

        // Create Medic ClinicUser
        const medicUser = await ClinicUser.create({
          email: 'medic@demo.dentms.ro',
          name: 'Dr. Medic',
          password: hashedPassword,
          role: 'medic',
          pin: hashedPinMedic,
          subaccount_of: adminUser.id,
          permissions: {
            personalAppointments: true,
          },
          photo: 'path/to/medic_photo.jpg', // Optional
        }, { transaction });
        console.log('Medic ClinicUser created:', medicUser.toJSON());

        // Create Medic Profile
        const medicProfile = await Medic.create({
          id: medicUser.id,
          name: 'Dr. Medic',
          employmentType: 'full-time',
          role: 'Dentist',
          phone: '555-1234',
          email: 'medic@demo.dentms.ro',
          address: '456 Dental Rd, Tooth City, USA',
          assignedTreatments: ['Teeth Cleaning', 'Orthodontics'],
          workingDaysHours: {
            Mon: '9am-5pm',
            Tue: '9am-5pm',
            Wed: '9am-5pm',
            Thu: '9am-5pm',
            Fri: '9am-5pm',
          },
          daysOff: ['Saturday', 'Sunday'],
          permissions: {
            personalAppointments: true,
          },
        }, { transaction });
        console.log('Medic profile created:', medicProfile.toJSON());

        // Create Patient ClinicUser
        const patientUser = await ClinicUser.create({
          email: 'patient@demo.dentms.ro',
          name: 'John Doe',
          password: hashedPassword,
          role: 'patient',
          permissions: {
            viewRecords: true,
          },
          photo: 'path/to/patient_photo.jpg', // Optional
        }, { transaction });
        console.log('Patient ClinicUser created:', patientUser.toJSON());

        // Create Patient Profile
        const patientProfile = await Patient.create({
          id: patientUser.id,
          age: 30,
          gender: 'Male',
          phone: '555-5678',
          email: 'patient@demo.dentms.ro',
          address: '123 Main St, Anytown, USA',
          labels: ['New Patient'],
          notes: 'No known allergies.',
          dentalHistory: {}, // Initially empty
          files: [], // Initially empty
          paymentsMade: [], // Initially empty
        }, { transaction });
        console.log('Patient profile created:', patientProfile.toJSON());

        // Create Component
        const component = await Component.create({
          componentName: 'Cleaning Kit',
          unitPrice: 20.0, // Price per unit
          vendor: 'Dental Supplies Inc.',
          quantity: 100, // Initial stock quantity
        }, { transaction });
        console.log('Component created:', component.toJSON());

        // Create Treatment
        const treatment = await Treatment.create({
          id: 'T001',
          name: 'Teeth Cleaning',
          category: 'Cleaning',
          description: 'Basic teeth cleaning service',
          duration: 30, // Duration in minutes
          components: [component.componentName],
          componentsUnits: [1], // Number of units of each component
          price: 100.0, // Assign the price here
        }, { transaction });
        console.log('Treatment created:', treatment.toJSON());

        // Create Appointment
        const appointment = await Appointment.create({
          appointmentId: '#AP0001',
          date: new Date().toISOString().split('T')[0], // Current date in 'YYYY-MM-DD' format
          time: '10:00', // Format: 'HH:MM'
          isDone: false,
          caseDetails: [{
            details: 'Routine teeth cleaning.',
            treatmentId: treatment.id,
            units: 1,
            involvedTeeth: [], // Not specific to certain teeth
            prescription: null,
          }],
          price: treatment.price,
          isPaid: false,
          status: 'upcoming', // Initial status
          patientId: patientProfile.id,
          medicId: medicProfile.id,
        }, { transaction });
        console.log('Appointment created:', appointment.toJSON());

        // Commit the transaction
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
