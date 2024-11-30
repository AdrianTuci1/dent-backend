

// Add Treatment to Appointment
exports.addTreatmentToAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { treatmentId, units, involvedTeeth, prescription, details } = req.body;


  try {
    const db = req.db;

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


  try {
    const db = req.db;

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



  try {
    const db = req.db;

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
