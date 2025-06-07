const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');

router.post('/api/save-finance', financeController.saveFinance);

module.exports = router;