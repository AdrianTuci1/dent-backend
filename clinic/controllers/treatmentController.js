const TreatmentService = require('../services/TreatmentService');

class TreatmentController {
  async createItems(req) {
    const treatmentService = new TreatmentService(req.db);
    const treatments = Array.isArray(req.body) ? req.body : [req.body];
    const createdTreatments = await treatmentService.createTreatments(treatments);

    return {
      message: `${createdTreatments.length} treatment(s) created successfully`,
      treatments: createdTreatments,
    };
  }

  async updateItems(req) {
    const treatmentService = new TreatmentService(req.db);
  
    // Ensure the request body is always an array
    const updates = Array.isArray(req.body) ? req.body : [req.body];
  
    // Validate that there are updates to process
    if (updates.length === 0) {
      throw new Error('No treatment updates provided');
    }
  
    // Call the service to process the updates
    const updatedTreatments = await treatmentService.updateTreatments(updates);
  
    // Return a structured response
    return {
      message: `${updatedTreatments.length} treatment(s) updated successfully`,
      treatments: updatedTreatments,
    };
  }

  async deleteItems(req) {
    const treatmentService = new TreatmentService(req.db);
    const treatmentIds = Array.isArray(req.body) ? req.body : [req.body];
    const deletedIds = await treatmentService.deleteTreatments(treatmentIds);

    return {
      message: `${deletedIds.length} treatment(s) deleted successfully`,
      deletedIds,
    };
  }

  async getAllTreatments(req, res) {
    try {
      const treatmentService = new TreatmentService(req.db);
      const { name = '', offset = 0 } = req.query;
      const limit = 20;

      const result = await treatmentService.getAllTreatments({ name, offset, limit });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      res.status(500).json({ message: 'Error fetching treatments', error: error.message });
    }
  }

  async getTreatmentById(req, res) {
    try {
      const treatmentService = new TreatmentService(req.db);
      const treatmentId = req.params.treatmentId;
      const treatment = await treatmentService.getTreatmentById(treatmentId);

      res.status(200).json({ treatment });
    } catch (error) {
      console.error('Error fetching treatment:', error);
      res.status(500).json({ message: 'Error fetching treatment', error: error.message });
    }
  }
}

module.exports = TreatmentController;