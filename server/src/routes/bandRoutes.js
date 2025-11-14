const express = require('express');
const router = express.Router();
const bandController = require('../controllers/bandController');

router.get('/', bandController.getAllBands);
router.post('/', bandController.createBand);
router.put('/:id', bandController.updateBand);

module.exports = router;