const express = require('express');
const { searchPatients, searchMedics, searchTreatments } = require("../controllers/searchController")
const { checkMedicAvailability } = require('../middleware/checkMedicAvailability');

const router = express.Router();

router.get("/patients", searchPatients);
router.get("/medics", searchMedics, checkMedicAvailability);
router.get("/treatments", searchTreatments)


module.exports = router;