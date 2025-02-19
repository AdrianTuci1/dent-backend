const express = require("express");
const router = express.Router();
const { getClinicData, updateClinicData } = require("../controllers/clinicController");

// Fetch clinic details
router.get("/", getClinicData);

// Update clinic details (admin-only)
router.put("/", updateClinicData);

module.exports = router;