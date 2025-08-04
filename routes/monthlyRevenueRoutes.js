const express = require('express');
const router = express.Router();
const monthlyFinanceSavingController = require('../controllers/monthlyFinanceSavingController');
const logger = require('../config/logger');
const cron = require('node-cron');

// Initialize cron job when router loads
cron.schedule('31 10 * * *', async () => {
    logger.info('Running scheduled daily financial update...');
    try {
        await monthlyFinanceSavingController.runDailyFinancialUpdate();
    } catch (error) {
        logger.error('Error in scheduled financial update:', error);
    }
});
logger.info('Financial cron job scheduled to run daily at 1am');

// Manual trigger endpoints
router.post('/calculate-monthly-revenue', async (req, res) => {
    try {
        await monthlyFinanceSavingController.calculateMonthlyRevenue();
        res.status(200).json({ message: 'Monthly revenue calculation completed successfully' });
    } catch (error) {
        logger.error('Error in monthly revenue calculation route:', error);
        res.status(500).json({ message: 'Error calculating monthly revenue', error: error.message });
    }
});

router.post('/check-monthly-revenue', async (req, res) => {
    try {
        await monthlyFinanceSavingController.checkAndUpdateMonthlyRevenue();
        res.status(200).json({ message: 'Monthly revenue check completed successfully' });
    } catch (error) {
        logger.error('Error in monthly revenue check route:', error);
        res.status(500).json({ message: 'Error checking monthly revenue', error: error.message });
    }
});

router.post('/trigger-daily-update', async (req, res) => {
    try {
        await monthlyFinanceSavingController.runDailyFinancialUpdate();
        res.status(200).json({ message: 'Daily financial update triggered successfully' });
    } catch (error) {
        logger.error('Error triggering daily update:', error);
        res.status(500).json({ message: 'Error triggering daily update', error: error.message });
    }
});

module.exports = router;
