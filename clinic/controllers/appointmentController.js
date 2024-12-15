const { Op } = require('sequelize');
const { getAppointments, deleteAppointment } = require('../../websockets/appointmentsState');
const { broadcastToSubdomain } = require('../../websockets/broadcast');

const generateAppointmentId = async (db) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear().toString().slice(-2); // Get last two digits of the year
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Get two-digit month

  const prefix = `AP${year}${month}`; // Build the prefix

  // Find the latest appointment ID for the current year and month
  const lastAppointment = await db.Appointment.findOne({
    where: {
      appointmentId: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['appointmentId', 'DESC']],
  });

  // Extract the sequential number and increment it
  const lastSequence = lastAppointment
    ? parseInt(lastAppointment.appointmentId.slice(-6), 10)
    : 0;

  const nextSequence = lastSequence + 1;
  const nextSequenceStr = nextSequence.toString().padStart(6, '0'); // Ensure 6 digits

  return `${prefix}${nextSequenceStr}`; // Combine all parts
};


exports.createAppointment = async (req, res, next) => {
  const { date, time, medicId, patientId, treatmentId, units, price } = req.body;


  try {
    const db = req.db;

    // Generate a new appointment ID
    const appointmentId = await generateAppointmentId(db);

    // Create the appointment
    await db.Appointment.create({
      appointmentId,
      date,
      time,
      medicUser: medicId,
      patientUser: patientId,
      price,
      status: 'upcoming',
    });

    // Add treatment if provided
    if (treatmentId) {
      await db.AppointmentTreatment.create({
        appointmentId,
        treatmentId,
        units: units || 1,
      });
    }

    // Attach the new appointment ID for broadcasting
    req.updatedAppointmentId = appointmentId;

    // Pass control to the broadcast middleware
    next();
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Error creating appointment', error: error.message });
  }
};


// Get Appointment Details including Initial Treatment, Medic, and Patient Information

// we need to add AppointmentTreatment info
// to this controller so we can get all the
// required information in 1 request

exports.getAppointmentDetails = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    // Get the clinic-specific database connection
    const db = req.db;

    // Find the appointment and include related data like Medic and Patient
    const appointment = await db.Appointment.findOne({
      where: { appointmentId },
      include: [
        {
          model: db.ClinicUser,
          as: 'medic',
          attributes: ['id', 'name'], // Include medic details
        },
        {
          model: db.ClinicUser,
          as: 'patient',
          attributes: ['id', 'name'], // Include patient details
        },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    // Fetch all treatments related to the appointment
    const treatments = await db.AppointmentTreatment.findAll({
      where: { appointmentId },
      include: [
        {
          model: db.Treatment,
          as: 'treatmentDetails', // Get treatment details based on treatmentId
          attributes: ['id', 'name', 'color'], // Include treatment fields
        },
      ],
    });

    // Transform the treatments into the desired format
    const formattedTreatments = treatments.map((t) => ({
      treatmentId: t.treatmentDetails.id,
      treatmentName: t.treatmentDetails.name,
      color: t.treatmentDetails.color,
      units: t.units,
      involvedTeeth: t.involvedTeeth, // Assuming this is an array or string in your DB
      prescription: t.prescription,
      details: t.details,
    }));

    // Format the response
    const response = {
      appointmentId: appointment.appointmentId,
      date: appointment.date,
      time: appointment.time,
      isDone: appointment.isDone,
      price: appointment.price,
      isPaid: appointment.isPaid,
      status: appointment.status,
      medicId: appointment.medic.id,
      medicUser: appointment.medic.name || appointment.medic.id,
      patientId: appointment.patient.id,
      patientUser: appointment.patient.name || appointment.patient.id,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      treatmentId: formattedTreatments[0]?.treatmentId || null,
      initialTreatment: formattedTreatments[0]?.treatmentName || null, // Get the first treatment name
      treatments: formattedTreatments, // Include all treatments in the response
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointment details', error: error.message });
  }
};



// Update Appointment (PATCH)
// Assumes req.db is a Sequelize DB connection with Appointment and AppointmentTreatment models
exports.updateAppointment = async (req, res, next) => {
  const { appointmentId } = req.params;
  const {
    date,
    time,
    medicId,
    patientId,
    price,
    treatments, // Optional array of treatments
    isDone,
    isPaid,
  } = req.body;

  try {
    const db = req.db;
    const appointment = await db.Appointment.findOne({ where: { appointmentId } });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Partial update of appointment fields
    if ('date' in req.body) {
      appointment.date = date;
    }
    if ('time' in req.body) {
      appointment.time = time;
    }
    if ('medicId' in req.body) {
      appointment.medicUser = medicId;
    }
    if ('patientId' in req.body) {
      appointment.patientUser = patientId;
    }
    if ('price' in req.body) {
      appointment.price = price;
    }
    if ('isDone' in req.body) {
      appointment.isDone = isDone;
    }
    if ('isPaid' in req.body) {
      appointment.isPaid = isPaid;
    }

    // If date or time changed, potentially update status
    if ('date' in req.body || 'time' in req.body) {
      const currentDateTime = new Date();
      const finalDate = appointment.date || '';
      const finalTime = appointment.time || '';
      const newAppointmentDateTime = new Date(`${finalDate}T${finalTime}`);
      if (newAppointmentDateTime > currentDateTime) {
        // Future date: Set status to "upcoming" if not done/paid
        appointment.status = 'upcoming';
      }
    }


    await appointment.save();

    // Update treatments if provided
    if (Array.isArray(treatments)) {
      // Fetch existing treatments for this appointment
      const existingTreatments = await db.AppointmentTreatment.findAll({
        where: { appointmentId },
      });

      // Create a map for quick lookup
      const existingTreatmentMap = new Map(
        existingTreatments.map((existingTreatment) => [
          `${existingTreatment.appointmentId}-${existingTreatment.treatmentId}`,
          existingTreatment,
        ])
      );

      // Normalize the incoming treatments, ensuring we only update fields if they are provided
      for (const treatment of treatments) {
        const key = `${appointmentId}-${treatment.treatmentId}`;
        if (existingTreatmentMap.has(key)) {
          // Partial update of existing treatment
          const existingTreatment = existingTreatmentMap.get(key);

          // Only update fields if they are provided in the request body
          if ('units' in treatment) existingTreatment.units = treatment.units;
          if ('involvedTeeth' in treatment) existingTreatment.involvedTeeth = treatment.involvedTeeth;
          if ('prescription' in treatment) existingTreatment.prescription = treatment.prescription;
          if ('details' in treatment) existingTreatment.details = treatment.details;

          await existingTreatment.save();
          existingTreatmentMap.delete(key);
        } else {
          // Create a new treatment only if treatmentId is provided
          // If treatmentId is mandatory, ensure it's present. Otherwise handle gracefully.
          if (treatment.treatmentId) {
            await db.AppointmentTreatment.create({
              appointmentId,
              treatmentId: treatment.treatmentId,
              units: 'units' in treatment ? treatment.units : 0,
              involvedTeeth: 'involvedTeeth' in treatment ? treatment.involvedTeeth : [],
              prescription: 'prescription' in treatment ? treatment.prescription : '',
              details: 'details' in treatment ? treatment.details : '',
            });
          }
        }
      }

      // Remove treatments not present in the updated list
      for (const [key, existingTreatment] of existingTreatmentMap.entries()) {
        await existingTreatment.destroy();
      }
    }

    // Attach updated appointment ID for broadcasting
    req.updatedAppointmentId = appointmentId;

    next(); // Pass control to the next middleware
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
};




// Delete Appointment
exports.deleteAppointment = async (req, res) => {
  const { appointmentId } = req.params;


  try {
    // Get the clinic-specific database connection
    const db = req.db;
    const subdomain = req.subdomain;

    const appointment = await db.Appointment.findOne({ where: { appointmentId } });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Remove related AppointmentTreatment records
    await db.AppointmentTreatment.destroy({ where: { appointmentId } });

    // Remove the appointment
    await appointment.destroy();

    // Update the in-memory state
    deleteAppointment(subdomain, appointmentId);

    // Broadcast the updated appointments list
    broadcastToSubdomain(subdomain, {
      type: 'appointments',
      action: 'view',
      data: getAppointments(subdomain),
    });

    res.status(200).json({ message: 'Appointment and related treatments deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting appointment', error });
  }
};



// Get Recent Appointments for a Patient (With Pagination)
exports.getPatientAppointments = async (req, res) => {
  const { patientId } = req.params; // Get patientId from params
  const { limit = 20, offset = 0 } = req.query; // Limit and offset for pagination

  try {
    const db = req.db;

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
      const color = appointment.AppointmentTreatments[0]?.treatmentDetails?.color || "#4287f5";

      return {
        appointmentId: appointment.appointmentId,
        date: appointment.date,
        time: appointment.time,
        medicUser: {
          id: appointment.medic.id,
          name: appointment.medic.name,
        },
        initialTreatment, // Return only the initial treatment
        color,
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


  try {
    const db = req.db;
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
            attributes: ['name', 'color'],
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
      color: appointment.AppointmentTreatments[0]?.treatmentDetails?.color || '#34abeb',
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
      color: appointment.AppointmentTreatments[0]?.treatmentDetails?.color || '#34abeb',
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







