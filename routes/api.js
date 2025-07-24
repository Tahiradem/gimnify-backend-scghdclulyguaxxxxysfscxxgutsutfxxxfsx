const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const healthController = require('../controllers/healthController');
const checkMembershipExpirations = require('../controllers/paymentAlertingController');

// router.post('/sending-sms', checkMembershipExpirations.sendManualSMS);

// Manual trigger endpoint
router.post('/trigger-update', notificationController.triggerUpdate);

// Health check endpoint
router.get('/health', healthController.healthCheck);


module.exports = router;