const express = require('express');
const { searchPatients, searchMedics } = require("../controllers/clinicDB/searchController")

const router = express.Router();

router.get("/patients", searchPatients);
router.get("/medics", searchMedics);


module.exports = router;