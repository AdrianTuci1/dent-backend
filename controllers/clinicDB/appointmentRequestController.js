// controllers/appointmentRequestController.js

const initializeClinicDatabase = require('../../models/clinicDB');
const { Op } = require('sequelize');

// Cache for database connections
const dbCache = {};

const getClinicDatabase = async (clinicDbName) => {
  if (dbCache[clinicDbName]) {
    return dbCache[clinicDbName];
  }

  const clinicDB = initializeClinicDatabase(clinicDbName);
  dbCache[clinicDbName] = clinicDB;

  return clinicDB;
};

// Endpoint 1: Get available dates

// Helper function to generate date range for the next three months
const getDateRange = (startDate, days = 90) => {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

exports.getAvailableDates = async (req, res) => {
  const { medic_id } = req.query;
  const clinicDbName = req.headers['x-clinic-db'];

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    // Define the timeframe and date range
    const today = new Date();
    const dateRange = getDateRange(today, 90); // Next 3 months

    // Fetch all unavailable slots within the date range
    const unavailableSlots = await db.AvailabilitySlots.findAll({
      attributes: ['date', 'start_time', 'end_time'],
      where: {
        medic_id,
        date: { [Op.between]: [today, new Date(today.setMonth(today.getMonth() + 3))] },
      },
    });

    // Group unavailable slots by date
    const unavailableByDate = unavailableSlots.reduce((acc, slot) => {
      const date = slot.date.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push({ start: slot.start_time, end: slot.end_time });
      return acc;
    }, {});

    // Define working hours (e.g., 9:00 to 17:00)
    const startOfDay = '09:00';
    const endOfDay = '17:00';

    // Calculate available dates
    const availableDates = [];
    for (const date of dateRange) {
      const slotsForDate = unavailableByDate[date] || [];

      // Check if there’s any 1-hour slot within working hours that’s available
      let currentTime = new Date(`1970-01-01T${startOfDay}:00Z`).getTime();
      const endTime = new Date(`1970-01-01T${endOfDay}:00Z`).getTime();

      let isDateAvailable = false;
      while (currentTime < endTime) {
        const nextHour = currentTime + 60 * 60 * 1000;

        // Check if this hour overlaps with any unavailable slot
        const isHourUnavailable = slotsForDate.some(slot => {
          const slotStart = new Date(`1970-01-01T${slot.start}:00Z`).getTime();
          const slotEnd = new Date(`1970-01-01T${slot.end}:00Z`).getTime();
          return currentTime < slotEnd && nextHour > slotStart;
        });

        if (!isHourUnavailable) {
          isDateAvailable = true;
          break;
        }

        currentTime = nextHour;
      }

      if (isDateAvailable) availableDates.push(date);
    }

    return res.status(200).json({ availableDates });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return res.status(500).json({ message: 'Error fetching available dates' });
  }
};



// Endpoint 2: Get available time slots for a specific date
exports.getAvailableTimeSlots = async (req, res) => {
  const { date, medic_id } = req.query;
  const clinicDbName = req.headers['x-clinic-db'];

  if (!clinicDbName || !date) {
    return res.status(400).json({ message: 'Missing clinic database name or date.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    let availableSlots;

    if (medic_id) {
      // Fetch available time slots for a specific medic on a specific date
      availableSlots = await db.AvailabilitySlots.findAll({
        attributes: ['start_time', 'end_time'],
        where: {
          medic_id,
          date,
          is_available: true,
        },
      });
    } else {
      // Fetch available time slots for the clinic on a specific date
      availableSlots = await db.ClinicAvailability.findAll({
        attributes: ['start_time', 'end_time'],
        where: {
          date,
          available_providers: { [Op.gt]: 0 },
        },
      });
    }

    const timeSlots = availableSlots.map(slot => ({
      start_time: slot.start_time,
      end_time: slot.end_time,
    }));

    return res.status(200).json({ availableTimeSlots: timeSlots });
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return res.status(500).json({ message: 'Error fetching available time slots' });
  }
};


exports.requestAppointment = async (req, res) => {
  const { patient_id, medic_id, requested_date, requested_time, reason, notes } = req.body;
  const clinicDbName = req.headers['x-clinic-db'];

  if (!clinicDbName) {
    return res.status(400).json({ message: 'Missing clinic database name.' });
  }

  try {
    // Step 1: Initialize or get the clinic-specific database
    const db = await getClinicDatabase(clinicDbName);

    // Use a transaction to ensure data consistency
    const transaction = await db.clinicSequelize.transaction();

    try {
      let clinicAvailable, slotAvailable;

      // Step 2: Check medic or clinic availability based on request parameters
      if (medic_id) {
        slotAvailable = await db.AvailabilitySlots.findOne({
          where: {
            medic_id,
            date: requested_date,
            start_time: requested_time,
            is_available: true,
          },
          transaction,
        });

        if (!slotAvailable) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'The requested time slot is unavailable with the selected medic. Please choose another time or medic.',
          });
        }
      } else {
        clinicAvailable = await db.ClinicAvailability.findOne({
          where: {
            date: requested_date,
            start_time: { [Op.lte]: requested_time },
            end_time: { [Op.gte]: requested_time },
            available_providers: { [Op.gt]: 0 },
          },
          transaction,
        });

        if (!clinicAvailable) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'The requested time slot is unavailable in the clinic. Please choose another time.',
          });
        }
      }

      // Step 3: Create the patient request in the clinic-specific database
      const appointmentRequest = await db.PatientRequest.create({
        patient_id,
        medic_id,
        requested_date,
        requested_time,
        status: 'pending',
        reason,
        notes,
        clinic_availability_id: clinicAvailable ? clinicAvailable.id : null,
      }, { transaction });

      // Commit the transaction if all goes well
      await transaction.commit();

      return res.status(201).json({
        message: 'Appointment request submitted successfully. A medic will review and provide further details.',
        appointmentRequest,
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error in transaction:', error);
      return res.status(500).json({ message: 'Error creating appointment request', error: error.message });
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return res.status(500).json({ message: 'Error initializing database', error: error.message });
  }
};



exports.listAppointmentRequests = async (req, res) => {
  const clinicDbName = req.headers['x-clinic-db'];
  const { status } = req.query; // Optional status filter (e.g., pending, approved, rejected)
  const medicId = req.headers['x-medic-id']; // Medic ID from the request header

  if (!clinicDbName || !medicId) {
    return res.status(400).json({ message: 'Missing clinic database name or medic ID.' });
  }

  try {
    const db = await getClinicDatabase(clinicDbName);

    // Define search criteria
    const whereClause = {
      ...(status && { status }),
      [Op.or]: [
        { medic_id: null }, // Requests without a specific medic
        { medic_id: medicId } // Requests assigned to the requesting medic
      ],
    };

    // Fetch all relevant appointment requests
    const appointmentRequests = await db.PatientRequest.findAll({
      where: whereClause,
      include: [
        { model: db.ClinicUser, as: 'patient', attributes: ['id', 'name', 'email'] },
        { model: db.ClinicUser, as: 'medic', attributes: ['id', 'name', 'email'], required: false },
      ],
      order: [['requested_date', 'ASC'], ['requested_time', 'ASC']],
    });

    return res.status(200).json({ appointmentRequests });
  } catch (error) {
    console.error('Error fetching appointment requests:', error);
    return res.status(500).json({ message: 'Error fetching appointment requests' });
  }
};

