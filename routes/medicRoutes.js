const medicController = require('../controllers/clinicDB/medicController');
const express = require('express');
const router = express.Router();

router.post('/', medicController.createMedic);
router.get('/:id', medicController.viewMedic);
router.put('/:id', medicController.updateMedic);
router.delete('/:id', medicController.deleteMedic);

module.exports = router;
