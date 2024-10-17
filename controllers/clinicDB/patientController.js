const initializeClinicDatabase = require('../../models/clinicDB');  // Import the initializer function

// Cache the initialized connections to avoid re-initializing for every request
const dbCache = {};

const getClinicDatabase = async (clinicDbName) => {
  if (dbCache[clinicDbName]) {
    return dbCache[clinicDbName];
  }

  const clinicDB = initializeClinicDatabase(clinicDbName);
  dbCache[clinicDbName] = clinicDB;

  return clinicDB;
};


const getPatients = async (req, res) => {
    try {
      const clinicDb = req.headers['x-clinic-db'];
      const db = await getClinicDatabase(clinicDb);
      
      if (!db || !db.ClinicUser) {
        return res.status(500).json({ message: 'Database connection or model not available' });
      }
  
      const clinicUsers = await db.ClinicUser.findAll({
        include: [
          {
            model: db.Patient,
            as: 'patientProfile', 
            attributes: ['id', 'gender', 'age', 'paymentsMade', 'labels'],
          },
          {
            model: db.Appointment,
            as: 'patientAppointments',
            attributes: ['appointmentId', 'date', 'time'],
          }
        ],
        attributes: ['id', 'name', 'email', 'role', 'photo'],
      });
  
      const currentTime = new Date();
  
      const dataWithAppointments = await Promise.all(clinicUsers
        .filter(clinicUser => clinicUser.patientProfile)  // Only include users with a patient profile
        .map(async (clinicUser) => {
          const pastAppointments = clinicUser.patientAppointments
            .filter(app => new Date(`${app.date}T${app.time}`) < currentTime)
            .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
  
          const futureAppointments = clinicUser.patientAppointments
            .filter(app => new Date(`${app.date}T${app.time}`) >= currentTime)
            .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
  
          let previousAppointment = null;
          let nextAppointment = null;
  
          if (pastAppointments[0]) {
            const appointmentTreatment = await db.AppointmentTreatment.findOne({
              where: { appointmentId: pastAppointments[0].appointmentId }
            });
  
            if (appointmentTreatment) {
              const treatment = await db.Treatment.findOne({
                where: { id: appointmentTreatment.treatmentId },
                attributes: ['name']
              });
              previousAppointment = {
                ...pastAppointments[0].dataValues,
                treatmentName: treatment ? treatment.name : null
              };
            }
          }
  
          if (futureAppointments[0]) {
            const appointmentTreatment = await db.AppointmentTreatment.findOne({
              where: { appointmentId: futureAppointments[0].appointmentId }
            });
  
            if (appointmentTreatment) {
              const treatment = await db.Treatment.findOne({
                where: { id: appointmentTreatment.treatmentId },
                attributes: ['name']
              });
              nextAppointment = {
                ...futureAppointments[0].dataValues,
                treatmentName: treatment ? treatment.name : null
              };
            }
          }
  
          return {
            id: clinicUser.id,
            name: clinicUser.name,
            email: clinicUser.email,
            role: clinicUser.role,
            photo: clinicUser.photo,
            patientProfile: {
              id: clinicUser.patientProfile.id,
              gender: clinicUser.patientProfile.gender,
              age: clinicUser.patientProfile.age,
              paymentsMade: clinicUser.patientProfile.paymentsMade,
              labels: clinicUser.patientProfile.labels,
            },
            previousAppointment,
            nextAppointment,
          };
        })
      );
  
      res.status(200).json(dataWithAppointments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error retrieving clinic users and patients' });
    }
  };



    // Create a new patient
  const createPatient = async (req, res) => {
    try {
      const clinicDb = req.headers['x-clinic-db'];
      const db = await getClinicDatabase(clinicDb);
      
      const { ClinicUser, Patient } = db;

      const { email, name, password, age, gender, phone, address, labels, notes } = req.body;

      // Create ClinicUser
      const newUser = await ClinicUser.create({
        email,
        name,
        password,
        role: 'patient', // Role set as patient
        photo: 'path/to/patient_photo.jpg',
      });

      // Create Patient Profile and associate with ClinicUser
      const newPatient = await Patient.create({
        id: newUser.id,
        age,
        gender,
        phone,
        email,
        address,
        labels,
        notes,
        dentalHistory: {},
        files: [],
        paymentsMade: [],
      });

      res.status(201).json({ message: 'Patient created successfully', patient: newPatient });
    } catch (error) {
      console.error('Error creating patient:', error);
      res.status(500).json({ message: 'Error creating patient', error: error.message });
    }
  };

  // Get patient by ID
  const getPatientById = async (req, res) => {
    const clinicDb = req.headers['x-clinic-db'];
    const { id } = req.params;

    try {
      const db = await getClinicDatabase(clinicDb);
      const { ClinicUser, Patient } = db;

      const patient = await ClinicUser.findByPk(id, {
        include: {
          model: Patient,
          as: 'patientProfile', // Adjust if necessary
        },
      });

      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      res.status(200).json(patient);
    } catch (error) {
      console.error('Error retrieving patient:', error);
      res.status(500).json({ message: 'Error retrieving patient', error: error.message });
    }
  };

  // Update patient details
  const updatePatient = async (req, res) => {
    const clinicDb = req.headers['x-clinic-db'];
    const { id } = req.params;
    const { name, age, gender, phone, address, labels, notes } = req.body;

    try {
      const db = await getClinicDatabase(clinicDb);
      const { ClinicUser, Patient } = db;

      const patientUser = await ClinicUser.findByPk(id);

      if (!patientUser) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // Update the ClinicUser fields if needed
      await patientUser.update({ name });

      // Update the associated Patient model
      const updatedPatient = await Patient.update(
        { age, gender, phone, address, labels, notes },
        { where: { id } }
      );

      res.status(200).json({ message: 'Patient updated successfully', patient: updatedPatient });
    } catch (error) {
      console.error('Error updating patient:', error);
      res.status(500).json({ message: 'Error updating patient', error: error.message });
    }
  };

  // Delete a patient by ID
  const deletePatient = async (req, res) => {
    const clinicDb = req.headers['x-clinic-db'];
    const { id } = req.params;

    try {
      const db = await getClinicDatabase(clinicDb);
      const { ClinicUser, Patient } = db;

      const patientUser = await ClinicUser.findByPk(id);

      if (!patientUser) {
        return res.status(404).json({ message: 'Patient not found' });
      }

      // Delete the associated Patient profile
      await Patient.destroy({ where: { id } });
      // Delete the ClinicUser record
      await ClinicUser.destroy({ where: { id } });

      res.status(200).json({ message: 'Patient deleted successfully' });
    } catch (error) {
      console.error('Error deleting patient:', error);
      res.status(500).json({ message: 'Error deleting patient', error: error.message });
    }
  };

  module.exports = {
    getPatients,
    createPatient,
    getPatientById,
    updatePatient,
    deletePatient,
  };


  
  
  
  
  