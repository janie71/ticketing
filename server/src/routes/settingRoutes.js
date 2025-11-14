const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');

router.get('/is-open', settingController.isReservationOpen);
router.get('/visible-dates', settingController.getVisibleDates);
router.get('/open-time', settingController.getOpenTime);

module.exports = router;