const medicController = require('../controllers/medicController');
const express = require('express');
const router = express.Router();

router.post('/', medicController.createMedic);
router.get('/', medicController.getAllMedicsForTable)
router.get('/:id', medicController.viewMedic);
router.put('/:id', medicController.updateMedic);
router.delete('/:id', medicController.deleteMedic);

module.exports = router;
