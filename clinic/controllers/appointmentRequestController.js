const Op = require('sequelize');

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

// controllers/availabilityController.js

exports.getAvailableDates = async (req, res) => {
  const { medic_id } = req.query;


  try {
    const db = req.db;

    // Fetch Days Off and Working Days Hours
    const daysOff = await db.DaysOff.findAll({ where: { medicId: medic_id } });
    const workingHours = await db.WorkingDaysHours.findAll({ where: { medicId: medic_id } });

    // Convert Days Off to a list of dates
    const daysOffSet = new Set();
    const today = new Date();
    const dateRange = getDateRange(today, 90); // Next 3 months

    daysOff.forEach(dayOff => {
      const startDate = new Date(dayOff.startDate);
      const endDate = dayOff.endDate ? new Date(dayOff.endDate) : startDate;

      dateRange.forEach(date => {
        if (
          (date >= startDate && date <= endDate) ||
          (dayOff.repeatYearly && date.getMonth() === startDate.getMonth() && date.getDate() === startDate.getDate())
        ) {
          daysOffSet.add(date.toISOString().split('T')[0]);
        }
      });
    });

    // Get available dates by checking working hours and excluding days off
    const availableDates = [];

    dateRange.forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      if (daysOffSet.has(dateString)) return; // Skip if it's a day off

      const dayName = date.toLocaleString('en-US', { weekday: 'long' });
      const workingDay = workingHours.find(day => day.day === dayName);

      if (workingDay) availableDates.push(dateString); // Include if it's a valid working day
    });

    return res.status(200).json({ availableDates });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return res.status(500).json({ message: 'Error fetching available dates' });
  }
};



// Endpoint 2: Get available time slots for a specific date

// controllers/availabilityController.js

exports.getAvailableTimeSlots = async (req, res) => {
  const { date, medic_id } = req.query;


  try {
    const db = req.db;

    // Check if the date falls within any day off range
    const dayOff = await db.DaysOff.findOne({
      where: {
        medicId: medic_id,
        [Op.or]: [
          { startDate: { [Op.lte]: date }, endDate: { [Op.gte]: date } },
          { startDate: { [Op.lte]: date }, endDate: null, repeatYearly: true },
        ],
      },
    });

    if (dayOff) {
      return res.status(200).json({ availableTimeSlots: [] }); // No slots if it's a day off
    }

    // Determine the day of the week for the given date
    const dayName = new Date(date).toLocaleString('en-US', { weekday: 'long' });

    // Get working hours for the specified day
    const workingHours = await db.WorkingDaysHours.findOne({
      where: { medicId: medic_id, day: dayName },
    });

    if (!workingHours || !workingHours.startTime || !workingHours.endTime) {
      return res.status(200).json({ availableTimeSlots: [] }); // No slots if no working hours
    }

    // Define working hours based on medic’s schedule
    const startOfDay = workingHours.startTime;
    const endOfDay = workingHours.endTime;

    // Fetch unavailable slots for the specific date and medic
    const unavailableSlots = await db.AvailabilitySlots.findAll({
      attributes: ['start_time', 'end_time'],
      where: { date, medic_id },
    });

    // Convert unavailable slots to time ranges
    const unavailableTimes = unavailableSlots.map(slot => ({
      start: new Date(`1970-01-01T${slot.start_time}`).getTime(),
      end: new Date(`1970-01-01T${slot.end_time}`).getTime(),
    }));

    // Calculate available time slots within working hours
    const availableTimeSlots = [];
    let currentTime = new Date(`1970-01-01T${startOfDay}`).getTime();
    const endTime = new Date(`1970-01-01T${endOfDay}`).getTime();

    while (currentTime < endTime) {
      const nextHour = currentTime + 60 * 60 * 1000;

      // Check if the current slot overlaps with any unavailable slot
      const isUnavailable = unavailableTimes.some(slot => {
        return currentTime < slot.end && nextHour > slot.start;
      });

      if (!isUnavailable) {
        availableTimeSlots.push(new Date(currentTime).toISOString().substring(11, 16)); // Format as HH:MM
      }

      currentTime = nextHour;
    }

    return res.status(200).json({ availableTimeSlots });
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return res.status(500).json({ message: 'Error fetching available time slots' });
  }
};



// request an appointment (patient)

exports.requestAppointment = async (req, res) => {
  const { patient_id, medic_id, requested_date, requested_time, reason, notes } = req.body;


  try {
    // Step 1: Initialize or get the clinic-specific database
    const db = req.db;

    // Use a transaction to ensure data consistency
    const transaction = await db.clinicSequelize.transaction();

    try {
      if (medic_id) {
        // Check if the requested slot for the specific medic is occupied
        const slotOccupied = await db.AvailabilitySlots.findOne({
          where: {
            medic_id,
            date: requested_date,
            start_time: requested_time,
            is_available: false,
          },
          transaction,
        });

        if (slotOccupied) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'The requested time slot is already occupied with the selected medic. Please choose another time or medic.',
          });
        }

        // Mark the slot as unavailable in AvailabilitySlots for the specific medic
        await db.AvailabilitySlots.update(
          { is_available: false },
          {
            where: {
              medic_id,
              date: requested_date,
              start_time: requested_time,
            },
            transaction,
          }
        );
      } else {
        // Check for availability at the clinic level if no specific medic is provided
        const clinicAvailable = await db.ClinicAvailability.findOne({
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

        // Decrement available providers by 1
        await clinicAvailable.decrement('available_providers', { transaction });
      }

      // Step 2: Create the patient request in the clinic-specific database
      const appointmentRequest = await db.PatientRequest.create({
        patient_id,
        medic_id,
        requested_date,
        requested_time,
        status: 'pending',
        reason,
        notes,
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
  const { status } = req.query; // Optional status filter (e.g., pending, approved, rejected)
  const medicId = req.headers['x-medic-id']; // Medic ID from the request header

  if ( !medicId) {
    return res.status(400).json({ message: 'Missing medic ID.' });
  }

  try {
    const db = req.db;

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

