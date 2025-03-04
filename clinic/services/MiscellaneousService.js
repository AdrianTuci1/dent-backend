class MiscellaneousService {
    constructor(db) {
      this.db = db;
    }
  
    // 🔹 Fetch all promotions
    async getAllPromotions() {
      return await this.db.Promotion.findAll();
    }
  
    // 🔹 Create a new promotion
    async createPromotion({ type, referenceId, discount, startDate, endDate }) {
      return await this.db.Promotion.create({
        type,
        referenceId,
        discount,
        startDate,
        endDate,
      });
    }
  
    // 🔹 Delete a promotion by ID
    async deletePromotion(promotionId) {
      return await this.db.Promotion.destroy({ where: { id: promotionId } });
    }
  
    // 🔹 Fetch all highlighted items
    async getAllHighlighted() {
      return await this.db.Highlighted.findAll();
    }
  
    // 🔹 Add a highlighted treatment/category (Ensures max 4 items)
    async addHighlighted({ type, referenceId, name }) {
      const count = await this.db.Highlighted.count();
      if (count >= 4) throw new Error('Cannot add more than 4 highlighted items.');
  
      return await this.db.Highlighted.create({
        type,
        referenceId,
        name,
      });
    }
  
    // 🔹 Remove a highlighted item
    async removeHighlighted(highlightedId) {
      return await this.db.Highlighted.destroy({ where: { id: highlightedId } });
    }
  }
  
  module.exports = MiscellaneousService;