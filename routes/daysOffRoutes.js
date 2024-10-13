// routes/daysOffRoutes.js
const express = require('express');
const router = express.Router();
const {getDaysOff, createDayOff, updateDayOff, deleteDayOff } = require('../controllers/clinicDB/daysOffController');

// Get all days off for a specific medic
router.get('/:medicId', getDaysOff);

// Create a new day off entry for a specific medic
router.post('/:medicId', createDayOff);

// Update a day off entry for a specific medic and day off ID
router.put('/:medicId/:dayOffId', updateDayOff);

// Delete a day off entry for a specific medic and day off ID
router.delete('/:medicId/:dayOffId', deleteDayOff);

module.exports = router;
