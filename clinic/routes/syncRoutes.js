const express = require('express');
const syncController = require('../controllers/SyncController');

const router = express.Router();

// Sync Edits Route
router.post('/', syncController.syncEdits);

module.exports = router;