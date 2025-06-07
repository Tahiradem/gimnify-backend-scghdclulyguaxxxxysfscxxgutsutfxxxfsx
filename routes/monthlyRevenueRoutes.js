const express = require('express');
const router = express.Router();
const monthlyRevenueController = require('../controllers/monthlyRevenueController');
const logger = require('../config/logger');

// Endpoint to manually trigger monthly revenue calculation
router.post('/calculate-monthly-revenue', async (req, res) => {
    try {
        await monthlyRevenueController.calculateMonthlyRevenue();
        res.status(200).json({ message: 'Monthly revenue calculation completed successfully' });
    } catch (error) {
        logger.error('Error in monthly revenue calculation route:', error);
        res.status(500).json({ message: 'Error calculating monthly revenue', error: error.message });
    }
});

// Endpoint to check and update monthly revenue if month changed
router.post('/check-monthly-revenue', async (req, res) => {
    try {
        await monthlyRevenueController.checkAndUpdateMonthlyRevenue();
        res.status(200).json({ message: 'Monthly revenue check completed successfully' });
    } catch (error) {
        logger.error('Error in monthly revenue check route:', error);
        res.status(500).json({ message: 'Error checking monthly revenue', error: error.message });
    }
});

module.exports = router;