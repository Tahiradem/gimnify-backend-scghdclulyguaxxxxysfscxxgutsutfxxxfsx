const express = require('express');
const router = express.Router();
const userController = require('../controllers/attendanceCheckController');

router.get('/qrcode', userController.getqrcode);
router.post('/postattendanceQrcode', userController.postattendanceQrcode);
module.exports = router;
