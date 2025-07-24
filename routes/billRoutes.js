const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

// Route to handle file + email upload
router.post('/upload-bill', billController.uploadBill);

module.exports = router;