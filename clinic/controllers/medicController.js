const MedicService = require('../services/MedicService');
const parseMedicBody = require('../../utils/paraseMedicBody');
const generateRandomString = require('../../utils/generateRandomString');

class MedicController {
  async createItems(req) {
    const medicService = new MedicService(req.db);
    const medicDataArray = Array.isArray(req.body) ? req.body : [req.body];

    // Parse and prepare medic data
    const parsedMedics = medicDataArray.map((data) => ({
      ...parseMedicBody(data),
      password: generateRandomString(),
      pin: '0000',
    }));

    const createdMedics = await medicService.createMedics(parsedMedics, req.userId);

    return {
      message: `${createdMedics.length} medic(s) created successfully`,
      medics: createdMedics,
    };
  }

  
  async updateItems(req) {
    const medicService = new MedicService(req.db);
    const medicDataArray = Array.isArray(req.body) ? req.body : [req.body];
  
    // Parse and flatten the medic data
    const parsedMedics = medicDataArray.map((data) => {
      const {
        id,
        info,
        assignedServices,
        daysOff,
        workingHours,
        permissions,
      } = data;
  
      return {
        id,
        ...info, // Spread fields from `info` (e.g., name, email, etc.)
        assignedTreatments: assignedServices?.assignedTreatments || [], // Extract assignedTreatments
        workingHours: Object.entries(workingHours || {}).map(([day, hours]) => {
          const [startTime, endTime] = hours.split('-');
          return { day, startTime, endTime };
        }), // Convert workingHours object to array
        daysOff: daysOff || [],
        permissions: permissions || [],
      };
    });
  
    // Update the medics
    await medicService.updateMedics(parsedMedics);
  
    return {
      message: `${parsedMedics.length} medic(s) updated successfully`,
    };
  }

  async deleteItems(req) {
    const medicService = new MedicService(req.db);
    const medicIds = Array.isArray(req.body) ? req.body : [req.body];

    await medicService.deleteMedics(medicIds);

    return {
      message: `${medicIds.length} medic(s) deleted successfully`,
    };
  }

  async viewMedic(req, res) {
    try {
      const medicService = new MedicService(req.db);
      const medic = await medicService.getMedicById(req.params.id);

      res.status(200).json(medic);
    } catch (error) {
      console.error('Error viewing medic:', error);
      res.status(500).json({ error: 'Failed to retrieve medic details', details: error.message });
    }
  }

  async getAllMedicsForTable(req, res) {
    try {
      const medicService = new MedicService(req.db);
      const formattedMedics = await medicService.getAllMedics();

      res.status(200).json(formattedMedics);
    } catch (error) {
      console.error('Error fetching medics:', error);
      res.status(500).json({ error: 'Failed to retrieve medics', details: error.message });
    }
  }
}

module.exports = MedicController;