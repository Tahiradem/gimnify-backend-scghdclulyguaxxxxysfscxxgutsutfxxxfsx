const Gym = require('../models/Gym');
const logger = require('../config/logger');
const moment = require('moment');

// Function to calculate daily financial record
const createDailyFinancialRecord = (income, outcome) => {
    return {
        income: income || 0,
        outcome: outcome || 0,
        revenue: (income || 0) - (outcome || 0)
    };
};

// Function to update monthly financial data
const updateMonthlyFinancialData = async () => {
    try {
        const gyms = await Gym.find({});
        const currentMonth = moment().format('MMM').toLowerCase();
        const currentDayName = moment().format('dddd'); // e.g. "Monday"
        const currentDate = moment().format('YYYY-MM-DD');

        for (const gym of gyms) {
            let needsUpdate = false;
            
            // Initialize monthly data structure if not exists
            if (!gym.monthlyIncome) gym.monthlyIncome = {};
            if (!gym.monthlyOutcome) gym.monthlyOutcome = {};
            if (!gym.monthlyRevenue) gym.monthlyRevenue = {};
            
            // Initialize month if not exists
            if (!gym.monthlyIncome[currentMonth]) gym.monthlyIncome[currentMonth] = {};
            if (!gym.monthlyOutcome[currentMonth]) gym.monthlyOutcome[currentMonth] = {};
            if (!gym.monthlyRevenue[currentMonth]) gym.monthlyRevenue[currentMonth] = {};
            
            // Initialize day of week if not exists
            if (!gym.monthlyIncome[currentMonth][currentDayName]) gym.monthlyIncome[currentMonth][currentDayName] = {};
            if (!gym.monthlyOutcome[currentMonth][currentDayName]) gym.monthlyOutcome[currentMonth][currentDayName] = {};
            if (!gym.monthlyRevenue[currentMonth][currentDayName]) gym.monthlyRevenue[currentMonth][currentDayName] = {};

            // Calculate daily totals from weekly data if available
            let dailyIncome = 0;
            let dailyOutcome = 0;

            if (gym.weeklyIncome && gym.weeklyIncome.length > 0) {
                gym.weeklyIncome.forEach(week => {
                    dailyIncome += week[moment().format('ddd')] || 0;
                });
            }

            if (gym.weeklyExpense && gym.weeklyExpense.length > 0) {
                gym.weeklyExpense.forEach(week => {
                    dailyOutcome += week[moment().format('ddd')] || 0;
                });
            }

            // If we have direct daily values, use those instead
            if (gym.dailyIncome && gym.dailyIncome.length > 0) {
                dailyIncome = gym.dailyIncome.reduce((a, b) => a + b, 0);
            }

            if (gym.dailyOutcome && gym.dailyOutcome.length > 0) {
                dailyOutcome = gym.dailyOutcome.reduce((a, b) => a + b, 0);
            }

            // Create daily record
            const dailyRecord = createDailyFinancialRecord(dailyIncome, dailyOutcome);

            // Check if we already have data for today
            if (!gym.monthlyIncome[currentMonth][currentDayName][currentDate]) {
                gym.monthlyIncome[currentMonth][currentDayName][currentDate] = dailyRecord;
                needsUpdate = true;
            }

            if (!gym.monthlyOutcome[currentMonth][currentDayName][currentDate]) {
                gym.monthlyOutcome[currentMonth][currentDayName][currentDate] = dailyRecord;
                needsUpdate = true;
            }

            if (!gym.monthlyRevenue[currentMonth][currentDayName][currentDate]) {
                gym.monthlyRevenue[currentMonth][currentDayName][currentDate] = dailyRecord;
                needsUpdate = true;
            }

            // Calculate monthly totals
            if (needsUpdate) {
                // Calculate totals by iterating through all days
                let incomeTotals = 0;
                let outcomeTotals = 0;
                let revenueTotals = 0;
                
                for (const dayOfWeek in gym.monthlyIncome[currentMonth]) {
                    for (const date in gym.monthlyIncome[currentMonth][dayOfWeek]) {
                        incomeTotals += gym.monthlyIncome[currentMonth][dayOfWeek][date].income || 0;
                        outcomeTotals += gym.monthlyOutcome[currentMonth][dayOfWeek][date].outcome || 0;
                        revenueTotals += gym.monthlyRevenue[currentMonth][dayOfWeek][date].revenue || 0;
                    }
                }

                // Update totals arrays
                if (!gym.monthlyIncomeTotals.includes(incomeTotals)) {
                    gym.monthlyIncomeTotals.push(incomeTotals);
                }

                if (!gym.monthlyExpenseTotals.includes(outcomeTotals)) {
                    gym.monthlyExpenseTotals.push(outcomeTotals);
                }

                if (!gym.monthlyRevenueTotals.includes(revenueTotals)) {
                    gym.monthlyRevenueTotals.push(revenueTotals);
                }

                gym.lastFinancialUpdate = new Date();
                await gym.save();
                logger.info(`Updated monthly financial data for gym ${gym.name} for ${currentMonth}`);
            }
        }
    } catch (error) {
        logger.error('Error updating monthly financial data:', error);
        throw error;
    }
};

// Function to check if month has changed and reset weekly data
const checkAndResetFinancialData = async () => {
    try {
        const gyms = await Gym.find({});
        const currentMonth = moment().format('MMM').toLowerCase();
        const currentDay = moment().date();

        for (const gym of gyms) {
            let needsReset = false;

            // Check if we have any monthly data
            if (gym.monthlyIncome && Object.keys(gym.monthlyIncome).length > 0) {
                const lastEntryMonth = Object.keys(gym.monthlyIncome).pop();
                
                // If month changed or it's the first day of month
                if (lastEntryMonth !== currentMonth && currentDay === 1) {
                    needsReset = true;
                }
            } else {
                // No monthly data yet, initialize
                needsReset = true;
            }

            if (needsReset) {
                // Reset weekly data at start of new month
                gym.weeklyIncome = Array(4).fill({
                    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
                });
                
                gym.weeklyExpense = Array(4).fill({
                    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
                });
                
                gym.weeklyRevenue = Array(4).fill({
                    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
                });

                // Reset daily arrays
                gym.dailyIncome = [];
                gym.dailyOutcome = [];
                gym.dailyRevenue = 0;

                await gym.save();
                logger.info(`Reset weekly financial data for gym ${gym.name} for new month ${currentMonth}`);
            }
        }
    } catch (error) {
        logger.error('Error checking and resetting financial data:', error);
        throw error;
    }
};

// Main function to run daily at 1am
const runDailyFinancialUpdate = async () => {
    try {
        logger.info('Starting daily financial update...');
        
        // First check if we need to reset weekly data for new month
        await checkAndResetFinancialData();
        
        // Then update monthly financial records
        await updateMonthlyFinancialData();
        
        logger.info('Daily financial update completed successfully');
    } catch (error) {
        logger.error('Error in daily financial update:', error);
        throw error;
    }
};

module.exports = {
    updateMonthlyFinancialData,
    checkAndResetFinancialData,
    runDailyFinancialUpdate
};