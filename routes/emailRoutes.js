const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.get("/send_email", emailController.sendEmail);

module.exports = router;