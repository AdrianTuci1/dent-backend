const initializeClinicDatabase = require('../../models/clinicDB');  // Import your initialize function

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

// Add Treatment to Appointment
exports.addTreatmentToAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { treatmentId, units, involvedTeeth, prescription, details } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    const appointmentTreatment = await db.AppointmentTreatment.create({
      appointmentId,
      treatmentId,
      units,
      involvedTeeth,
      prescription,
      details
    });

    res.status(201).json({ message: 'Treatment added to appointment successfully', appointmentTreatment });
  } catch (error) {
    res.status(500).json({ message: 'Error adding treatment to appointment', error });
  }
};

// Get All Treatments for an Appointment
exports.getAllTreatmentsForAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    const treatments = await db.AppointmentTreatment.findAll({
      where: { appointmentId },
      include: [db.Treatment]
    });

    if (!treatments) {
      return res.status(404).json({ message: 'No treatments found for this appointment' });
    }

    res.status(200).json({ treatments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching treatments for appointment', error });
  }
};

// Remove Treatment from Appointment
exports.removeTreatmentFromAppointment = async (req, res) => {
  const { appointmentId, treatmentId } = req.params;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    const appointmentTreatment = await db.AppointmentTreatment.findOne({
      where: { appointmentId, treatmentId }
    });

    if (!appointmentTreatment) {
      return res.status(404).json({ message: 'Treatment not found for this appointment' });
    }

    await appointmentTreatment.destroy();

    res.status(200).json({ message: 'Treatment removed from appointment successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing treatment from appointment', error });
  }
};
