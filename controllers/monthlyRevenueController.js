const Gym = require('../models/Gym');
const logger = require('../config/logger');
const moment = require('moment');

// Function to calculate and update monthly revenue
const calculateMonthlyRevenue = async () => {
    try {
        const gyms = await Gym.find({});
        const currentMonth = moment().format('MMM').toLowerCase();
        const currentDay = moment().date(); // Get current day of month (1-31)
        
        // Only proceed if it's the first day of the month OR if we're in development
        if (currentDay !== 1 && process.env.NODE_ENV !== 'development') {
            logger.info('Not the first day of month - skipping monthly revenue calculation');
            return;
        }

        for (const gym of gyms) {
            // Check if we have weeklyRevenue data
            if (gym.weeklyRevenue && gym.weeklyRevenue.length > 0) {
                let totalMonthlyRevenue = 0;
                
                // Sum up revenue from all available weeks
                gym.weeklyRevenue.forEach(week => {
                    Object.values(week).forEach(dayRevenue => {
                        totalMonthlyRevenue += dayRevenue;
                    });
                });
                
                // Check if current month already exists in monthlyRevenue
                const existingMonthIndex = gym.monthlyRevenue.findIndex(
                    item => Object.keys(item)[0] === currentMonth
                );
                
                if (existingMonthIndex >= 0) {
                    // Update existing month entry
                    gym.monthlyRevenue[existingMonthIndex][currentMonth] = totalMonthlyRevenue;
                } else {
                    // Add new month entry
                    gym.monthlyRevenue.push({
                        [currentMonth]: totalMonthlyRevenue
                    });
                }
                
                await gym.save();
                logger.info(`Updated monthly revenue for gym ${gym.name} for ${currentMonth}: ${totalMonthlyRevenue}`);
            }
        }
    } catch (error) {
        logger.error('Error calculating monthly revenue:', error);
        throw error;
    }
};

// Function to check if month has changed and trigger calculation
const checkAndUpdateMonthlyRevenue = async () => {
    try {
        const gyms = await Gym.find({});
        const currentMonth = moment().format('MMM').toLowerCase();
        const currentDay = moment().date();
        
        // Check if it's the first day of the month
        const isFirstDayOfMonth = currentDay === 1;
        
        for (const gym of gyms) {
            if (gym.monthlyRevenue && gym.monthlyRevenue.length > 0) {
                const lastEntry = gym.monthlyRevenue[gym.monthlyRevenue.length - 1];
                const lastMonth = Object.keys(lastEntry)[0];
                
                // If month changed or it's the first day of month
                if (lastMonth !== currentMonth || isFirstDayOfMonth) {
                    await calculateMonthlyRevenue();
                    break; // No need to check other gyms if condition met
                }
            } else {
                // No monthly revenue data yet, calculate for first time
                await calculateMonthlyRevenue();
                break;
            }
        }
    } catch (error) {
        logger.error('Error checking monthly revenue update:', error);
        throw error;
    }
};

module.exports = {
    calculateMonthlyRevenue,
    checkAndUpdateMonthlyRevenue
};