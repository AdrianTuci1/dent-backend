const { Op } = require('sequelize');

const getPatients = async (req, res) => {
  try {
    const db = req.db;

    if (!db || !db.ClinicUser) {
      return res.status(500).json({ message: 'Database connection or model not available' });
    }

    // Extract query parameters for search and pagination
    const { name = '', offset = 0 } = req.query; // Default: empty search, offset = 0
    const limit = 20; // Results limited to 20 per request

    // Query clinic users with search and pagination
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
        },
      ],
      where: {
        name: {
          [Op.iLike]: `%${name}%`, // Search by name (case-insensitive match)
        },
      },
      attributes: ['id', 'name', 'email', 'role', 'photo'],
      limit: limit,
      offset: parseInt(offset), // Offset for "Load More" functionality
    });

    const currentTime = new Date();

    // Process appointments and build the response data
    const dataWithAppointments = await Promise.all(
      clinicUsers
        .filter(clinicUser => clinicUser.patientProfile) // Include only users with a patient profile
        .map(async clinicUser => {
          const pastAppointments = clinicUser.patientAppointments
            .filter(app => new Date(`${app.date}T${app.time}`) < currentTime)
            .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));

          const futureAppointments = clinicUser.patientAppointments
            .filter(app => new Date(`${app.date}T${app.time}`) >= currentTime)
            .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + a.time));

          let previousAppointment = null;
          let nextAppointment = null;

          // Fetch previous appointment's treatment details
          if (pastAppointments[0]) {
            const appointmentTreatment = await db.AppointmentTreatment.findOne({
              where: { appointmentId: pastAppointments[0].appointmentId },
            });

            if (appointmentTreatment) {
              const treatment = await db.Treatment.findOne({
                where: { id: appointmentTreatment.treatmentId },
                attributes: ['name', 'color'],
              });
              previousAppointment = {
                ...pastAppointments[0].dataValues,
                treatmentName: treatment ? treatment.name : null,
                color: treatment ? treatment.color : null,
              };
            }
          }

          // Fetch next appointment's treatment details
          if (futureAppointments[0]) {
            const appointmentTreatment = await db.AppointmentTreatment.findOne({
              where: { appointmentId: futureAppointments[0].appointmentId },
            });

            if (appointmentTreatment) {
              const treatment = await db.Treatment.findOne({
                where: { id: appointmentTreatment.treatmentId },
                attributes: ['name', 'color'],
              });
              nextAppointment = {
                ...futureAppointments[0].dataValues,
                treatmentName: treatment ? treatment.name : null,
                color: treatment? treatment.color : null,
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

    res.status(200).json({ data: dataWithAppointments, limit, offset: parseInt(offset) + limit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving clinic users and patients' });
  }
};



    // Create a new patient
  const createPatient = async (req, res) => {
    try {
      const db = req.db;
      
      const { ClinicUser, Patient } = db;

      const { email, name, age, gender, phone, address, labels, notes } = req.body;

      // Create ClinicUser
      const newUser = await ClinicUser.create({
        email,
        name,
        password: 'password',
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
    const { id } = req.params;

    try {
      const db = req.db;
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
    const { id } = req.params;
    const { name, age, gender, phone, address, labels, notes } = req.body;

    try {
      const db = req.db;
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
    const { id } = req.params;

    try {
      const db = req.db;
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


  
  
  
  
  