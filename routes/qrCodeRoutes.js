// routes/qrCodeRoutes.js
const express = require('express');
const router = express.Router();
const QRCodeController = require('../controllers/qrCodeController');

// Existing routes
router.post('/generate-all', QRCodeController.generateQRForAllUsers);
router.post('/generate/:gymId/:userId', QRCodeController.generateQRForSingleUser);
router.get('/:gymId/:userId', QRCodeController.getUserQRCode);

// New route for scanning QR codes
router.get('/scan/:qrData', QRCodeController.handleQRScan);

module.exports = router;