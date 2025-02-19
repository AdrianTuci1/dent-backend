class ClinicDataService {
    constructor(db) {
      this.db = db; // This is the clinic-specific database injected via middleware
    }
  
    // Fetch clinic details (assuming there's only one row)
    async getClinicData() {
      return await this.db.ClinicInfo.findOne();
    }
  
    // Update clinic details
    async updateClinicData(updates) {
      const clinic = await this.db.ClinicInfo.findOne();
      if (!clinic) throw new Error("Clinic data not found");
  
      return await clinic.update(updates);
    }
  }
  
  module.exports = ClinicDataService;