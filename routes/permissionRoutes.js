// routes/permissions.js
const express = require('express');
const router = express.Router();
const { getUserPermissions, updateUserPermissions } = require('../controllers/clinicDB/permissionController');

router.get('/:userId', getUserPermissions);
router.put('/:userId', updateUserPermissions);

module.exports = router;