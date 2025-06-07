const express = require('express');
const router = express.Router();
const qrScannerController = require('../controllers/qrScannerController');

// Update attendance route
router.post('/update-attendance', qrScannerController.updateAttendance);

module.exports = router;