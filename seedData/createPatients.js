const bcrypt = require('bcrypt');

const createPatients = async (models, transaction) => {
  const hashedPassword = await bcrypt.hash('password', 10);

  const { ClinicUser, Patient } = models

  const patientsData = [
    {
      email: 'patient1@demo.dentms.ro',
      name: 'John Doe',
      age: 30,
      gender: 'Male',
      phone: '555-5678',
      address: '123 Main St, Anytown, USA',
      labels: ['New Patient'],
      notes: 'No known allergies.',
    },
    {
      email: 'patient2@demo.dentms.ro',
      name: 'Jane Smith',
      age: 25,
      gender: 'Female',
      phone: '555-1234',
      address: '456 Maple St, Anycity, USA',
      labels: ['Follow-up'],
      notes: 'Allergic to penicillin.',
    },
    {
      email: 'patient3@demo.dentms.ro',
      name: 'Emily Johnson',
      age: 40,
      gender: 'Female',
      phone: '555-6789',
      address: '789 Oak St, Somewhere, USA',
      labels: ['VIP'],
      notes: 'Requires extra time for anxiety.',
    },
    {
      email: 'patient4@demo.dentms.ro',
      name: 'Michael Brown',
      age: 32,
      gender: 'Male',
      phone: '555-9876',
      address: '321 Pine St, Overthere, USA',
      labels: ['Returning'],
      notes: 'History of gum issues.',
    },
    {
      email: 'patient5@demo.dentms.ro',
      name: 'Sarah Wilson',
      age: 28,
      gender: 'Female',
      phone: '555-5432',
      address: '654 Elm St, Thistown, USA',
      labels: ['Follow-up'],
      notes: 'Sensitive to anesthesia.',
    },
  ];
  

  const patientUsers = [];
  
  for (const patient of patientsData) {
    const patientUser = await ClinicUser.create({
      email: patient.email,
      name: patient.name,
      password: hashedPassword,
      role: 'patient',
      photo: 'path/to/patient_photo.jpg',
    }, { transaction });

    console.log('Patient ClinicUser created:', patientUser.toJSON());

    await Patient.create({
      id: patientUser.id,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      labels: patient.labels,
      notes: patient.notes,
      dentalHistory: {},
      files: [],
      paymentsMade: [],
    }, { transaction });

    patientUsers.push(patientUser);
  }
  return patientUsers;
};

module.exports = createPatients;
