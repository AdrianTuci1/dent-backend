const express = require('express');
const MiscellaneousController = require('../controllers/miscellaneousController');

const router = express.Router();
const miscellaneousController = new MiscellaneousController(); // Matches existing structure

// 🔹 Promotions Routes
router.get('/promotions', miscellaneousController.getPromotions);
router.post('/promotions', miscellaneousController.createPromotion);
router.delete('/promotions/:id', miscellaneousController.deletePromotion);

// 🔹 Highlighted Items Routes
router.get('/highlighted', miscellaneousController.getHighlighted);
router.post('/highlighted', miscellaneousController.addHighlighted);
router.delete('/highlighted/:id', miscellaneousController.removeHighlighted);

module.exports = router;