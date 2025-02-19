const ClinicDataService = require("../services/ClinicService");

// View clinic details
const getClinicData = async (req, res) => {
  try {
    const clinicService = new ClinicDataService(req.db); // Use the injected clinic DB
    const clinic = await clinicService.getClinicData();

    if (!clinic) {
      return res.status(404).json({ error: "Clinic data not found" });
    }

    res.status(200).json(clinic);
  } catch (error) {
    console.error("❌ Error fetching clinic data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit clinic details
const updateClinicData = async (req, res) => {
  try {
    const clinicService = new ClinicDataService(req.db);
    const updatedClinic = await clinicService.updateClinicData(req.body);

    res.status(200).json({ message: "Clinic updated successfully", clinic: updatedClinic });
  } catch (error) {
    console.error("❌ Error updating clinic data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getClinicData, updateClinicData };