const express = require('express');
const { searchPatients, searchMedics, searchTreatments } = require("../controllers/searchController")

const router = express.Router();

router.get("/patients", searchPatients);
router.get("/medics", searchMedics);
router.get("/treatments", searchTreatments)


module.exports = router;