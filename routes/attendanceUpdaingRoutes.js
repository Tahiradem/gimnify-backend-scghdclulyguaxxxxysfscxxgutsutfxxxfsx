const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceUpdaingController');

router.post('/updateAttendance', attendanceController.attendanceChanging);
module.exports = router;