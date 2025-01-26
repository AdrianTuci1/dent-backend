const PatientService = require('../services/PatientService');

class PatientController {
  async getPatients(req, res) {
    try {
      const patientService = new PatientService(req.db);
      const { name = '', offset = 0 } = req.query;
      const patients = await patientService.getPatients(name, offset);

      res.status(200).json(patients);
    } catch (error) {
      console.error('Error retrieving patients:', error);
      res.status(500).json({ error: 'Failed to fetch patients', details: error.message });
    }
  }

  async createItems(req) {
    const patientService = new PatientService(req.db);
    const patientsData = Array.isArray(req.body) ? req.body : [req.body]; // Handle batch or single

    const createdPatients = await patientService.createPatients(patientsData);
    return {
      message: `${createdPatients.length} patient(s) created successfully`,
      patients: createdPatients,
    };
  }

  async updateItems(req) {
    const patientService = new PatientService(req.db);
    const patientsData = Array.isArray(req.body) ? req.body : [req.body]; // Handle batch or single

    const updatedPatients = await patientService.updatePatients(patientsData);
    return {
      message: `${updatedPatients.length} patient(s) updated successfully`,
      patients: updatedPatients,
    };
  }

  async deleteItems(req) {
    const patientService = new PatientService(req.db);
    const patientIds = Array.isArray(req.body) ? req.body : [req.body]; // Handle batch or single

    const deletedPatients = await patientService.deletePatients(patientIds);
    return {
      message: `${deletedPatients.length} patient(s) deleted successfully`,
    };
  }

  async getPatientById(req, res) {
    try {
      const patientService = new PatientService(req.db);
      const patient = await patientService.getPatientById(req.params.id);

      res.status(200).json(patient);
    } catch (error) {
      console.error('Error fetching patient:', error);
      res.status(500).json({ error: 'Failed to retrieve patient', details: error.message });
    }
  }
}

module.exports = PatientController;