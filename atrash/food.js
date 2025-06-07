require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const mongoose = require('./config/db');
const logger = require('./config/logger');
const apiRoutes = require('./routes/api');
const updateDailyNotifications = require('./jobs/dailyNotificationJob');

// Initialize Express app with better middleware
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Enhanced scheduling with overlapping job prevention
let isJobRunning = false;

cron.schedule('50 17 * * *', async () => {
    if (isJobRunning) {
        logger.warn('Previous notification job still running - skipping this execution');
        return;
    }
    
    isJobRunning = true;
    try {
        await updateDailyNotifications();
    } catch (error) {
        logger.error('Unexpected error in scheduled job:', error);
    } finally {
        isJobRunning = false;
    }
});

// Start server with better error handling
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    
    // Initial data sync
    updateDailyNotifications().catch(err => 
        logger.error('Initial update failed:', err)
    );
});

// Enhanced shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received - shutting down gracefully');
    server.close(() => {
        mongoose.disconnect().then(() => {
            logger.info('Server and MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received - shutting down gracefully');
    server.close(() => {
        mongoose.disconnect().then(() => {
            logger.info('Server and MongoDB connection closed');
            process.exit(0);
        });
    });
});

// Global error handler
process.on('uncaughtException', err => {
    logger.error('Uncaught exception:', err);
    // Attempt graceful shutdown
    server.close(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});