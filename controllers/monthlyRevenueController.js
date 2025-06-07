const Gym = require('../models/Gym');
const logger = require('../config/logger');
const moment = require('moment');

// Function to calculate and update monthly revenue
const calculateMonthlyRevenue = async () => {
    try {
        const gyms = await Gym.find({});
        const currentMonth = moment().format('MMM').toLowerCase();
        
        for (const gym of gyms) {
            // Check if we have at least 4 weeks of weeklyRevenue data
            if (gym.weeklyRevenue && gym.weeklyRevenue.length >= 4) {
                const last4Weeks = gym.weeklyRevenue.slice(-4);
                let totalMonthlyRevenue = 0;
                
                // Sum up revenue from last 4 weeks
                last4Weeks.forEach(week => {
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
                    gym.monthlyRevenue[existingMonthIndex][currentMonth] = `${totalMonthlyRevenue}birr`;
                } else {
                    // Add new month entry
                    gym.monthlyRevenue.push({
                        [currentMonth]: `${totalMonthlyRevenue}birr`
                    });
                }
                
                await gym.save();
                logger.info(`Updated monthly revenue for gym ${gym.name} for ${currentMonth}`);
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
        
        for (const gym of gyms) {
            if (gym.monthlyRevenue && gym.monthlyRevenue.length > 0) {
                const lastEntry = gym.monthlyRevenue[gym.monthlyRevenue.length - 1];
                const lastMonth = Object.keys(lastEntry)[0];
                
                if (lastMonth !== currentMonth) {
                    await calculateMonthlyRevenue();
                    break; // No need to check other gyms if month changed
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