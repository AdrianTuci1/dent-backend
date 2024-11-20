const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const initializeClinicDatabase = require('../models');  // Import your initialize function

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
          attributes: ['name', 'color'],
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



// Get Recent Appointments for a Patient (With Pagination)
exports.getPatientAppointments = async (req, res) => {
  const { patientId } = req.params; // Get patientId from params
  const { limit = 20, offset = 0 } = req.query; // Limit and offset for pagination
  const clinicDbName = req.headers['x-clinic-db']; // Get clinic database from headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    // Fetch the most recent appointments for the patient, limited to the given number
    const appointments = await db.Appointment.findAll({
      where: { patientUser: patientId },
      order: [['date', 'DESC']], // Order by date, most recent first
      limit: parseInt(limit), // Limit the number of results
      offset: parseInt(offset), // Skip the first 'offset' results (for pagination)
      include: [
        {
          model: db.ClinicUser,
          as: 'medic', // Include medic details
          attributes: ['id', 'name'],
        },
        {
          model: db.AppointmentTreatment, // Include AppointmentTreatment model
          as: 'AppointmentTreatments', // Use the correct alias for AppointmentTreatment
          include: [
            {
              model: db.Treatment, // Include Treatment model
              as: 'treatmentDetails', // Ensure the correct alias for Treatment is used
              attributes: ['name', 'color'], // Include the treatment name
            },
          ],
          order: [['createdAt', 'ASC']], // Fetch treatments in chronological order
          limit: 1, // Only include the first (initial) treatment
        },
      ],
    });

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for this patient.' });
    }

    // Format the response
    const formattedAppointments = appointments.map((appointment) => {
      const initialTreatment = appointment.AppointmentTreatments[0]?.treatmentDetails?.name || null; // Get only the first treatment

      return {
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        time: appointment.time,
        medicUser: {
          id: appointment.medic.id,
          name: appointment.medic.name,
        },
        initialTreatment, // Return only the initial treatment
      };
    });

    res.status(200).json({
      appointments: formattedAppointments,
      totalAppointments: formattedAppointments.length,
      message: 'Appointments fetched successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
};


        // Helper function to get today's date range (start and end)
        const getTodayRange = () => {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Start of today
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1); // Start of tomorrow
          return { today, tomorrow };
        };




// Controller to get appointments for both today and the next 20 upcoming appointments (excluding today)
exports.getMedicAppointments = async (req, res) => {
  const { medicId } = req.params; // medicId can be optional
  const clinicDbName = req.headers['x-clinic-db'];  // Get the clinic database name from the headers

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);
    const { today, tomorrow } = getTodayRange();  // Get today's start and end times

    // Define the conditions for today and upcoming appointments
    const whereConditionToday = {
      date: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    };

    const whereConditionUpcoming = {
      date: {
        [Op.gt]: today,
      },
    };

    // If medicId is provided, restrict the query to that medic's appointments
    if (medicId) {
      whereConditionToday.medicUser = medicId;
      whereConditionUpcoming.medicUser = medicId;
    }

    // Fetch today's appointments (from all medics or specific medic if medicId is provided)
    const todaysAppointments = await db.Appointment.findAll({
      where: whereConditionToday,
      include: [
        {
          model: db.ClinicUser,
          as: 'medic', // Include medic details
          attributes: ['id', 'name'],
        },
        {
          model: db.ClinicUser,
          as: 'patient', // Include patient details
          attributes: ['id', 'name'],
        },
        {
          model: db.AppointmentTreatment,
          as: 'AppointmentTreatments', // Use alias for AppointmentTreatment
          include: {
            model: db.Treatment,
            as: 'treatmentDetails', // Fetch treatment details
            attributes: ['name', 'color'],
          },
        },
      ],
      order: [['time', 'ASC']], // Sort by time
    });

    // Fetch the next 20 upcoming appointments (from all medics or specific medic if medicId is provided)
    const upcomingAppointments = await db.Appointment.findAll({
      where: whereConditionUpcoming,
      include: [
        {
          model: db.ClinicUser,
          as: 'medic', // Include medic details
          attributes: ['id', 'name'],
        },
        {
          model: db.ClinicUser,
          as: 'patient', // Include patient details
          attributes: ['id', 'name'],
        },
        {
          model: db.AppointmentTreatment,
          as: 'AppointmentTreatments', // Use alias for AppointmentTreatment
          include: {
            model: db.Treatment,
            as: 'treatmentDetails', // Fetch treatment details
            attributes: ['name'],
          },
        },
      ],
      limit: 20, // Limit to the next 20 appointments
      order: [['date', 'ASC'], ['time', 'ASC']], // Sort by date, then by time
    });

    // Format today's appointments
    const formattedTodaysAppointments = todaysAppointments.map((appointment) => ({
      appointmentId: appointment.appointmentId,
      date: appointment.date,
      time: appointment.time,
      patientUser: {
        id: appointment.patient.id,
        name: appointment.patient.name,
      },
      medicUser: {
        id: appointment.medic.id,
        name: appointment.medic.name,
      },
      initialTreatment: appointment.AppointmentTreatments[0]?.treatmentDetails?.name || null, // Get the initial treatment
    }));

    // Format upcoming appointments
    const formattedUpcomingAppointments = upcomingAppointments.map((appointment) => ({
      appointmentId: appointment.appointmentId,
      date: appointment.date,
      time: appointment.time,
      patientUser: {
        id: appointment.patient.id,
        name: appointment.patient.name,
      },
      medicUser: {
        id: appointment.medic.id,
        name: appointment.medic.name,
      },
      initialTreatment: appointment.AppointmentTreatments[0]?.treatmentDetails?.name || null, // Get the initial treatment
    }));

    res.status(200).json({
      today: formattedTodaysAppointments,
      upcoming: formattedUpcomingAppointments,
      message: 'Appointments fetched successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching medic appointments', error: error.message });
  }
};







