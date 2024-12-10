const { calculateEndHour } = require('../../utils/calcultateEndHour');
const { broadcastToSubdomain } = require('../../websockets/appointmentsSockets');


exports.broadcastUpdatedAppointment = async (req, res) => {
    const { updatedAppointmentId } = req;
    const db = req.db;
  
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
                attributes: ['name', 'color', 'duration'],
              },
            ],
          },
        ],
      });
  
      if (!updatedAppointment) {
        return res.status(404).json({ message: 'Updated appointment not found' });
      }
  
      // Enrich data for broadcasting
      const initialTreatment = updatedAppointment.AppointmentTreatments[0]?.treatmentDetails;
      const medic = updatedAppointment.medic.name
      const patient = updatedAppointment.patient.name
  
      const enrichedData = {
        appointmentId: updatedAppointment.appointmentId,
        status: updatedAppointment.status,
        startHour: updatedAppointment.time,
        endHour: calculateEndHour(updatedAppointment.time, updatedAppointment.AppointmentTreatments),
        date: updatedAppointment.date,
        patientId: updatedAppointment.patient.id,
        medicId: updatedAppointment.medic.id,
        patientUser: patient || 'Unknown',
        medicUser: medic || 'Unknown',
        initialTreatment: initialTreatment?.name || 'None',
        color: initialTreatment?.color || '#FFD700',
      };

        
      // Update the status dynamically

      // Update status based on isDone and isPaid
      // If isDone and isPaid => 'done'
      // If isDone and not isPaid => 'notpaid'
      // If neither isDone nor isPaid, fallback to status if provided or existing status
      const { isDone, isPaid } = updatedAppointment;
      if (isDone && isPaid) {
        updatedAppointment.status = 'done';
      } else if (isDone && !isPaid) {
        updatedAppointment.status = 'notpaid';
      } else if (isPaid && !isDone) {
        updatedAppointment.status = enrichedData.status || 'upcoming';
      } else {
        updatedAppointment.status = enrichedData.status || 'pending';
      }

      // Save the updated status
      await updatedAppointment.save();

    // Update enrichedData with the new status
    enrichedData.status = updatedAppointment.status;

      console.log(enrichedData)
  
      // Broadcast enriched data
      broadcastToSubdomain(req.subdomain, {
        type: 'updateAppointment',
        data: enrichedData,
      });
  
      // Respond to the client
      res.status(200).json({ message: 'Appointment updated and broadcasted successfully', data: enrichedData });
    } catch (error) {
      console.error('Error broadcasting appointment:', error);
      res.status(500).json({ message: 'Error broadcasting appointment', error: error.message });
    }
  };
  