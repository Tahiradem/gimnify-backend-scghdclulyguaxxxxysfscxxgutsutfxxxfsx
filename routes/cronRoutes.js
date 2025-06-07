const express = require('express');
const router = express.Router();
const cronController = require('../controllers/cronController');

// This route is just to initialize the cron job
router.get('/init-cron', (req, res) => {
    cronController.scheduleFinanceUpdate();
    res.send('Cron job initialized');
});

module.exports = router;