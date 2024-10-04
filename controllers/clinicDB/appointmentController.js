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

// Generate the next appointmentId in the format 'AP000001'
const generateAppointmentId = async (db) => {
  // Get the latest appointment
  const lastAppointment = await db.Appointment.findOne({
    order: [['appointmentId', 'DESC']],
  });

  if (!lastAppointment || !lastAppointment.appointmentId) {
    // If no appointments exist, start with 'AP000001'
    return 'AP000001';
  }

  // Extract the numeric part from the last appointment ID (e.g., 'AP000001' -> 1)
  const lastIdNumber = parseInt(lastAppointment.appointmentId.slice(2), 10);
  const nextIdNumber = lastIdNumber + 1;

  // Format the new appointment ID (e.g., 2 -> 'AP000002')
  return `AP${nextIdNumber.toString().padStart(6, '0')}`;
};

exports.createAppointment = async (req, res) => {
  const { date, time, medicUser, patientUser, treatmentId, units, price } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    // Get the clinic-specific database connection
    const db = await getClinicDatabase(clinicDbName);

    // Generate a new appointment ID
    const appointmentId = await generateAppointmentId(db);

    // Create the appointment
    const appointment = await db.Appointment.create({
      appointmentId,
      date,
      time,
      medicUser,
      patientUser,
      price,
      status: 'upcoming',
    });

    // Add initial treatment to AppointmentTreatment
    if (treatmentId) {
      await db.AppointmentTreatment.create({
        appointmentId: appointment.appointmentId,
        treatmentId,
        units: units || 1,  // Default to 1 unit if not provided
      });
    }

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment,
      initialTreatmentId: treatmentId,  // Return the initial treatment ID in the response
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating appointment', error });
  }
};



// Get Appointment Details including Initial Treatment, Medic, and Patient Information
exports.getAppointmentDetails = async (req, res) => {
  const { appointmentId } = req.params;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    // Get the clinic-specific database connection
    const db = await getClinicDatabase(clinicDbName);

    // Find the appointment and include related data like Medic, Patient, and Initial Treatment
    const appointment = await db.Appointment.findOne({
      where: { appointmentId },
      include: [
        {
          model: db.ClinicUser,
          as: 'medic',
          attributes: ['id', 'name'],  // Include medic details
        },
        {
          model: db.ClinicUser,
          as: 'patient',
          attributes: ['id', 'name'],  // Include patient details
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Fetch the first AppointmentTreatment for the initial treatment
    const initialTreatment = await db.AppointmentTreatment.findOne({
      where: { appointmentId },
      include: [
        {
          model: db.Treatment,
          as: 'treatmentDetails',  // Get treatment details (name) based on treatmentId
          attributes: ['name'],
        }
      ],
      order: [['createdAt', 'ASC']]  // Fetch the first treatment created for this appointment
    });

    // Format the response based on your Appointment type
    const response = {
      appointmentId: appointment.appointmentId,
      date: appointment.date,
      time: appointment.time,
      isDone: appointment.isDone,
      price: appointment.price,
      isPaid: appointment.isPaid,
      status: appointment.status,
      medicUser: appointment.medic.name || appointment.medic.id,
      patientUser: appointment.patient.name || appointment.patient.id,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      initialTreatment: initialTreatment?.treatmentDetails?.name || null,  // Get the initial treatment name
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointment details', error: error.message });
  }
};



// Update Appointment
exports.updateAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { date, time, medicUser, patientUser, price, status, treatmentId, units } = req.body;  // Including treatmentId and units if provided
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    // Get the clinic-specific database connection
    const db = await getClinicDatabase(clinicDbName);

    const appointment = await db.Appointment.findOne({ where: { appointmentId } });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Update appointment fields
    appointment.date = date || appointment.date;
    appointment.time = time || appointment.time;
    appointment.medicUser = medicUser || appointment.medicUser;
    appointment.patientUser = patientUser || appointment.patientUser;
    appointment.price = price || appointment.price;
    appointment.status = status || appointment.status;

    await appointment.save();

    // Update initial treatment if treatmentId is provided
    if (treatmentId) {
      const appointmentTreatment = await db.AppointmentTreatment.findOne({ where: { appointmentId } });
      if (appointmentTreatment) {
        appointmentTreatment.treatmentId = treatmentId;
        appointmentTreatment.units = units || appointmentTreatment.units;
        await appointmentTreatment.save();
      }
    }

    res.status(200).json({ message: 'Appointment updated successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error });
  }
};


// Delete Appointment
exports.deleteAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    // Get the clinic-specific database connection
    const db = await getClinicDatabase(clinicDbName);

    const appointment = await db.Appointment.findOne({ where: { appointmentId } });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Remove related AppointmentTreatment records
    await db.AppointmentTreatment.destroy({ where: { appointmentId } });

    // Remove the appointment
    await appointment.destroy();

    res.status(200).json({ message: 'Appointment and related treatments deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting appointment', error });
  }
};
