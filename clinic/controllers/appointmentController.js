const AppointmentService = require('../services/AppointmentService');
const { getTodayRange } = require('../../utils/dateUtils');

class AppointmentController {
  async createItems(req) {
    const appointmentService = new AppointmentService(req.db);
    const appointmentsData = Array.isArray(req.body) ? req.body : [req.body];

    const createdAppointments = await appointmentService.createAppointments(appointmentsData);

    return {
      message: `${createdAppointments.length} appointment(s) created successfully`,
      appointments: createdAppointments,
    };
  }

  async updateItems(req) {
    const appointmentService = new AppointmentService(req.db);
    const appointmentsData = Array.isArray(req.body) ? req.body : [req.body];

    const updatedAppointments = await appointmentService.updateAppointments(appointmentsData);

    return {
      message: `${updatedAppointments.length} appointment(s) updated successfully`,
      appointments: updatedAppointments,
    };
  }

  async deleteItems(req) {
    const appointmentService = new AppointmentService(req.db);
    const appointmentIds = Array.isArray(req.body) ? req.body : [req.body];

    await appointmentService.deleteAppointments(appointmentIds);

    return {
      message: `${appointmentIds.length} appointment(s) deleted successfully`,
    };
  }

  async getAppointmentDetails(req, res) {
    try {
      const appointmentService = new AppointmentService(req.db);
      const appointment = await appointmentService.getAppointmentDetails(req.params.appointmentId);

      res.status(200).json(appointment);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      res.status(500).json({ error: 'Failed to fetch appointment details', details: error.message });
    }
  }

  async getPatientAppointments(req, res) {
    const { patientId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    try {
      const appointmentService = new AppointmentService(req.db);
      const appointments = await appointmentService.getPatientAppointments(patientId, limit, offset);

      if (!appointments.length) {
        return res.status(404).json({ message: 'No appointments found for this patient.' });
      }

      res.status(200).json({
        appointments,
        totalAppointments: appointments.length,
        message: 'Appointments fetched successfully',
      });
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      res.status(500).json({ message: 'Error fetching patient appointments', error: error.message });
    }
  }

  async getMedicAppointments(req, res) {
    const { medicId } = req.params;
    const { today } = getTodayRange();

    try {
      const appointmentService = new AppointmentService(req.db);
      const appointments = await appointmentService.getMedicAppointments(medicId, today);

      if (!appointments.length) {
        return res.status(404).json({ message: 'No appointments found for this medic.' });
      }

      res.status(200).json({
        appointments,
        message: 'Upcoming appointments fetched successfully',
      });
    } catch (error) {
      console.error('Error fetching medic appointments:', error);
      res.status(500).json({ message: 'Error fetching medic appointments', error: error.message });
    }
  }
}

module.exports = AppointmentController;