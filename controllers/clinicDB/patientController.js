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


exports.getPatients = async (req, res) => {
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



  
  
  
  
  