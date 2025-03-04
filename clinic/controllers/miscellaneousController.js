const MiscellaneousService = require('../services/MiscellaneousService');

class MiscellaneousController {
  constructor() {
    this.service = null; // Will be initialized inside each request handler
  }

  // Initialize service with `req.db`
  initializeService(req) {
    if (!this.service) {
      this.service = new MiscellaneousService(req.db);
    }
  }

  // 🔹 Get all promotions
  getPromotions = async (req, res) => {
    try {
      this.initializeService(req);
      const promotions = await this.service.getAllPromotions();
      res.status(200).json(promotions);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching promotions', error: error.message });
    }
  };

  // 🔹 Create a promotion
  createPromotion = async (req, res) => {
    try {
      this.initializeService(req);
      const newPromotion = await this.service.createPromotion(req.body);
      res.status(201).json(newPromotion);
    } catch (error) {
      res.status(400).json({ message: 'Error creating promotion', error: error.message });
    }
  };

  // 🔹 Delete a promotion
  deletePromotion = async (req, res) => {
    try {
      this.initializeService(req);
      const { id } = req.params;
      await this.service.deletePromotion(id);
      res.status(200).json({ message: 'Promotion deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting promotion', error: error.message });
    }
  };

  // 🔹 Get all highlighted items
  getHighlighted = async (req, res) => {
    try {
      this.initializeService(req);
      const highlighted = await this.service.getAllHighlighted();
      res.status(200).json(highlighted);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching highlighted items', error: error.message });
    }
  };

  // 🔹 Add a highlighted item
  addHighlighted = async (req, res) => {
    try {
      this.initializeService(req);
      const newHighlighted = await this.service.addHighlighted(req.body);
      res.status(201).json(newHighlighted);
    } catch (error) {
      res.status(400).json({ message: 'Error adding highlighted item', error: error.message });
    }
  };

  // 🔹 Remove a highlighted item
  removeHighlighted = async (req, res) => {
    try {
      this.initializeService(req);
      const { id } = req.params;
      await this.service.removeHighlighted(id);
      res.status(200).json({ message: 'Highlighted item removed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error removing highlighted item', error: error.message });
    }
  };
}

module.exports = MiscellaneousController;