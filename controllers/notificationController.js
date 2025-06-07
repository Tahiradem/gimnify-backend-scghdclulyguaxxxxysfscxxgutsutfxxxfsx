const logger = require('../config/logger');
const updateDailyNotifications = require('../jobs/dailyNotificationJob');

let isJobRunning = false;

const triggerUpdate = async (req, res) => {
    const { authKey } = req.body;
    
    // Simple auth check - in production use proper authentication
    if (authKey !== process.env.ADMIN_KEY) {
        logger.warn('Unauthorized trigger attempt');
        return res.status(403).send('Unauthorized');
    }
    
    if (isJobRunning) {
        return res.status(429).send('Update already in progress');
    }
    
    isJobRunning = true;
    try {
        logger.info('Manual update triggered via API');
        await updateDailyNotifications();
        res.status(200).send('Notifications updated successfully');
    } catch (error) {
        logger.error('Manual update failed:', error);
        res.status(500).send('Update failed - check logs');
    } finally {
        isJobRunning = false;
    }
};

module.exports = {
    triggerUpdate
};