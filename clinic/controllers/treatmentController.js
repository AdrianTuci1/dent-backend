const TreatmentService = require('../services/TreatmentService');

class TreatmentController {
  async createItems(req, res) {
    try {
      const treatmentService = new TreatmentService(req.db);
      const treatments = Array.isArray(req.body) ? req.body : [req.body];
      const createdTreatments = await treatmentService.createTreatments(treatments);
  
      // ✅ Send response back to the client
      res.status(201).json({
        message: `${createdTreatments.length} treatment(s) created successfully`,
        treatments: createdTreatments,
      });
    } catch (error) {
      console.error('❌ Error creating treatments:', error);
      res.status(500).json({ message: 'Failed to create treatments', error: error.message });
    }
  }

  async updateItems(req, res) {
    try {
      const treatmentService = new TreatmentService(req.db);
  
      // Ensure the request body is always an array
      const updates = Array.isArray(req.body) ? req.body : [req.body];
  
      // Validate that there are updates to process
      if (updates.length === 0) {
        return res.status(400).json({ message: 'No treatment updates provided' });
      }
  
      // Call the service to process the updates
      const updatedTreatments = await treatmentService.updateTreatments(updates);
  
      console.log(`✅ Successfully updated ${updatedTreatments.length} treatment(s)`, updatedTreatments);
  
      // Send the response with the updated treatments
      return res.status(200).json({
        message: `${updatedTreatments.length} treatment(s) updated successfully`,
        treatments: updatedTreatments,
      });
  
    } catch (error) {
      console.error('❌ Error updating treatments:', error);
      return res.status(500).json({ message: 'Failed to update treatments', error: error.message });
    }
  }


  async deleteSingleTreatment(req, res) {
    try {
      const treatmentId = req.params.id;
      if (!treatmentId) {
        return res.status(400).json({ message: "Treatment ID is required for deletion." });
      }

      const treatmentService = new TreatmentService(req.db);
      
      const deletedId = await treatmentService.deleteSingleTreatment(treatmentId);
      return res.status(200).json({
        message: "Treatment deleted successfully",
        deletedId,
      });
    } catch (error) {
      console.error("Error in deleteSingleTreatment:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  // In your treatmentController.js
  async deleteItems(req, res) {
    try {
      const treatmentIds = req.body; // Expecting an array: ["T001", "T002"]
      if (!Array.isArray(treatmentIds) || treatmentIds.length === 0) {
        return res.status(400).json({ message: "No treatment IDs provided" });
      }
      const treatmentService = new TreatmentService(req.db);

      const deletedIds = await treatmentService.deleteSingleTreatment(treatmentIds);
      return res.status(200).json({
        message: `${deletedIds.length} treatment(s) deleted successfully`,
        deletedIds,
      });
    } catch (error) {
      console.error("Error in batch treatment deletion:", error);
      return res.status(500).json({ message: error.message });
    }
  }

  async getAllTreatments(req, res) {
    try {
      const treatmentService = new TreatmentService(req.db);
      
      // ✅ Ensure `name` is extracted as a string
      const name = typeof req.query.name === 'string' ? req.query.name : '';
  
      console.log(`Fetching treatments with name: "${name || 'ALL'}"`); // ✅ Debugging log
  
      // ✅ Pass name correctly as a string
      const result = await treatmentService.getAllTreatments(name);
  
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