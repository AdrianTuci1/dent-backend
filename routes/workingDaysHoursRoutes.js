// routes/workingDaysHoursRoutes.js
const express = require('express');
const router = express.Router();
const { getWorkingDaysHours, createWorkingDaysHours, updateWorkingDaysHours, deleteWorkingDaysHours } = require('../controllers/clinicDB/workingDaysHoursController');

// Get all working days and hours for a specific medic
router.get('/:medicId', getWorkingDaysHours);

// Create a new working day and hours entry for a specific medic
router.post('/:medicId', createWorkingDaysHours);

// Update a working day and hours entry for a specific medic and day
router.put('/:medicId/:day', updateWorkingDaysHours);

// Delete a working day and hours entry for a specific medic and day
router.delete('/:medicId/:day', deleteWorkingDaysHours);

module.exports = router;
