
const express = require('express');
const { bulkPatchDentalHistory, getDentalHistory } = require('../controllers/dentalHistoryController');
const router = express.Router();

// Bulk patch route for dental history
router.patch('/bulkPatch', bulkPatchDentalHistory);

router.get('/:patientId', getDentalHistory)

module.exports = router;
