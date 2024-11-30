const { Op } = require('sequelize');  // Import Op directly from Sequelize

exports.checkMedicAvailability = async (req, res) => {
    const { date, time, duration, medicId } = req.query;
  
    // Validate input parameters
    if (!date || !time || !duration) {
      return res.status(400).json({
        error: "Missing required fields: date, time, or duration.",
      });
    }
  
    try {
      const db = req.db;
      const medicsWithAvailability = [];
      let availabilityMessage = null;
  
      // Convert the date to day and requested timeframe
      const dayOfWeek = new Date(date).toLocaleDateString("en-US", { weekday: "short" }); // e.g., Mon, Tue
      const requestedStartTime = new Date(`${date}T${time}`);
      const requestedEndTime = new Date(
        requestedStartTime.getTime() + duration * 60000
      );
  
      for (const medic of req.medics) {
        // Check Working Days and Hours
        const workingHours = await db.WorkingDaysHours.findOne({
          where: {
            medicId: medic.id,
            day: dayOfWeek,
          },
        });
  
        if (
          !workingHours ||
          requestedStartTime < new Date(`${date}T${workingHours.start_time}`) ||
          requestedEndTime > new Date(`${date}T${workingHours.end_time}`)
        ) {
          medicsWithAvailability.push({
            id: medic.id,
            name: medic.name,
            isAvailable: false,
          });
  
          if (medicId && parseInt(medicId) === medic.id) {
            availabilityMessage = "Selected medic does not work on this day or time.";
          }
  
          continue; // Skip further checks for this medic
        }
  
        // Check Days Off
        const daysOff = await db.DaysOff.findOne({
          where: {
            medicId: medic.id,
            startDate: { [Op.lte]: date }, // Start date <= requested date
            endDate: { [Op.gte]: date },   // End date >= requested date
          },
        });
  
        if (daysOff) {
          medicsWithAvailability.push({
            id: medic.id,
            name: medic.name,
            isAvailable: false,
          });
  
          if (medicId && parseInt(medicId) === medic.id) {
            availabilityMessage = `Selected medic is on ${daysOff.name}.`;
          }
  
          continue; // Skip further checks for this medic
        }
  
        // Check Availability Slots
        const unavailableSlots = await db.AvailabilitySlots.findAll({
          where: {
            medic_id: medic.id,
            date,
            is_available: false,
          },
        });
  
        if (unavailableSlots.length === 0) {
          medicsWithAvailability.push({
            id: medic.id,
            name: medic.name,
            isAvailable: true,
          });
  
          if (medicId && parseInt(medicId) === medic.id) {
            availabilityMessage = "Selected medic is available.";
          }
  
          continue; // No conflicts, skip to the next medic
        }
  
        let isAvailable = true;
  
        for (const slot of unavailableSlots) {
          const slotStartTime = new Date(`${slot.date}T${slot.start_time}`);
          const slotEndTime = new Date(`${slot.date}T${slot.end_time}`);
  
          if (
            (requestedStartTime >= slotStartTime && requestedStartTime < slotEndTime) || // Starts during an unavailable slot
            (requestedEndTime > slotStartTime && requestedEndTime <= slotEndTime) || // Ends during an unavailable slot
            (requestedStartTime <= slotStartTime && requestedEndTime >= slotEndTime) // Fully overlaps an unavailable slot
          ) {
            isAvailable = false;
            break;
          }
        }
  
        medicsWithAvailability.push({
          id: medic.id,
          name: medic.name,
          isAvailable,
        });
  
        if (medicId && parseInt(medicId) === medic.id) {
          availabilityMessage = isAvailable
            ? "Selected medic is available."
            : "Selected medic is unavailable.";
        }
      }
  
      if (!availabilityMessage) {
        availabilityMessage = "Medic availability checked.";
      }
  
      res.status(200).json({ medics: medicsWithAvailability, message: availabilityMessage });
    } catch (error) {
      console.error("Error checking medic availability:", error);
      res.status(500).json({ error: "Failed to check medic availability." });
    }
  };
  