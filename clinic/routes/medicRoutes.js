const MedicController = require('../controllers/medicController');
const express = require('express');
const router = express.Router();

const medicController = new MedicController();

router.post('/', medicController.createItems);
router.get('/', medicController.getAllMedicsForTable)
router.get('/:id', medicController.viewMedic);
router.put('/:id', medicController.updateItems);
router.put('/', medicController.updateItems)
router.delete('/:id', medicController.deleteItems);
router.delete('/', medicController.deleteItems)

module.exports = router;
