const express = require('express');
const router = express.Router();
const { getSubaccounts } = require('../controllers/subaccountController');
const { authenticate } = require('../middleware/authMiddleware');  // JWT middleware

// Fetch subaccounts (must be authenticated)
router.get('/subaccounts', authenticate, getSubaccounts);

module.exports = router;
