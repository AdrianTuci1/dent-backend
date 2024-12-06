
exports.updateAppointmentTreatments = async (req, res) => {
  const { appointmentId } = req.params; // Extract appointmentId from the route
  const { treatments } = req.body; // Extract treatments array from the request body

  try {
    const db = req.db;

    // Validate the input
    if (!Array.isArray(treatments)) {
      return res.status(400).json({ error: 'Invalid treatments format. Expected an array.' });
    }

    // Ensure the appointment exists
    const appointmentExists = await db.Appointment.findByPk(appointmentId);
    if (!appointmentExists) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Start a transaction for atomic updates
    const transaction = await db.sequelize.transaction();

    try {
      // Remove all existing treatments for this appointment
      await db.AppointmentTreatment.destroy({
        where: { appointmentId },
        transaction,
      });

      // Add new treatments
      const formattedTreatments = treatments.map((treatment) => ({
        appointmentId,
        treatmentId: treatment.treatmentId,
        units: treatment.units,
        involvedTeeth: treatment.involvedTeeth ? treatment.involvedTeeth.join(',') : null,
        prescription: treatment.prescription || null,
        details: treatment.details || null,
      }));

      await db.AppointmentTreatment.bulkCreate(formattedTreatments, { transaction });

      // Commit the transaction
      await transaction.commit();

      res.status(200).json({ message: 'Treatments updated successfully.' });
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating treatments:', error);
    res.status(500).json({ error: 'Failed to update treatments.' });
  }
};
