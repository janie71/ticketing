const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// 모든 관리자 API는 인증 필요
router.use(auth);

// 설정 관리
router.put('/settings/toggle-reservation', adminController.toggleReservation);
router.put('/settings/open-time', adminController.setOpenTime);
router.delete('/settings/open-time', adminController.clearOpenTime);

// 차단 시간 관리
router.get('/blocked-times', adminController.getBlockedTimes);
router.post('/blocked-times', adminController.addBlockedTime);
router.delete('/blocked-times/:id', adminController.deleteBlockedTime);

// 공개 날짜 관리
router.post('/visible-dates', adminController.addVisibleDate);
router.delete('/visible-dates/:id', adminController.deleteVisibleDate);

// 팀 관리
router.delete('/bands/:id', adminController.deleteBand);

// 예약 관리 (모든 예약)
router.delete('/reservations/:id', adminController.deleteReservation);

router.delete('/settings/open-time', adminController.clearOpenTime);

module.exports = router;