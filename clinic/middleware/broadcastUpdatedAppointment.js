const { calculateEndHour } = require('../../utils/calcultateEndHour');
const { broadcastToSubdomain } = require('../../websockets/broadcast');
const { updateAppointment } = require('../../websockets/appointmentsState');

exports.broadcastUpdatedAppointment = async (req, res) => {
  const { updatedAppointmentId } = req; // Extract necessary details from the request
  const db = req.db;
  const subdomain = req.subdomain;

  try {
    // Fetch the updated appointment with related data
    const updatedAppointment = await db.Appointment.findOne({
      where: { appointmentId: updatedAppointmentId },
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
        {
          model: db.AppointmentTreatment,
          as: 'AppointmentTreatments',
          include: [
            {
              model: db.Treatment,
              as: 'treatmentDetails',
              attributes: ['name', 'color', 'duration'], // Include treatment details
            },
          ],
        },
      ],
    });

    if (!updatedAppointment) {
      return res.status(404).json({ message: 'Appointment not found for broadcasting' });
    }

    // Enrich data for broadcasting
    const initialTreatment = updatedAppointment.AppointmentTreatments[0]?.treatmentDetails;
    const medic = updatedAppointment.medic?.name || 'Unknown';
    const patient = updatedAppointment.patient?.name || 'Unknown';

    const enrichedData = {
      appointmentId: updatedAppointment.appointmentId,
      status: updatedAppointment.status,
      startHour: updatedAppointment.time,
      endHour: calculateEndHour(updatedAppointment.time, updatedAppointment.AppointmentTreatments),
      date: updatedAppointment.date,
      patientId: updatedAppointment.patient?.id || null,
      medicId: updatedAppointment.medic?.id || null,
      patientUser: patient,
      medicUser: medic,
      initialTreatment: initialTreatment?.name || 'None',
      color: initialTreatment?.color || '#FFD700',
    };

    // Dynamically update the status based on isDone and isPaid flags
    const { isDone, isPaid } = updatedAppointment;
    if (!isDone && !isPaid) {
      enrichedData.status = 'upcoming'
    }
      else if (isDone && isPaid) {
      enrichedData.status = 'done';
    } else if (isDone && !isPaid) {
      enrichedData.status = 'notpaid';
    } else if (isPaid && !isDone) {
      enrichedData.status = 'upcoming';
    } else {
      enrichedData.status = 'missed';
    }

    // Save the updated status back to the database
    updatedAppointment.status = enrichedData.status;
    await updatedAppointment.save();

    // Update the in-memory state
    updateAppointment(subdomain, enrichedData);

    // Broadcast enriched data
    broadcastToSubdomain(subdomain, {
      type: 'appointments',
      action: 'view',
      data: enrichedData,
    });

    // Respond to the client
    res.status(200).json({ message: 'Appointment updated and broadcasted successfully', data: enrichedData });
  } catch (error) {
    console.error('Error broadcasting appointment:', error);
    res.status(500).json({ message: 'Error broadcasting appointment', error: error.message });
  }
};
