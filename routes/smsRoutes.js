const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

router.get("/send_sms", smsController.sendSMS);

module.exports = router;