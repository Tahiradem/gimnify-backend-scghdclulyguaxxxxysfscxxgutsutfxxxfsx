const Gym = require('../models/Gym');
const logger = require('../config/logger');
const moment = require('moment');

// Function to calculate daily financial record
const createDailyFinancialRecord = (income, outcome) => {
    return {
        income: income || 0,
        outcome: outcome || 0,
        revenue: (income || 0) - (outcome || 0),
        day: moment().format('YYYY-MM-DD')
    };
};

// Function to update monthly financial data
const updateMonthlyFinancialData = async () => {
    try {
        const gyms = await Gym.find({});
        const currentMonth = moment().format('MMM').toLowerCase();
        const currentDay = moment().date();
        const currentDate = moment().format('YYYY-MM-DD');

        for (const gym of gyms) {
            let needsUpdate = false;
            const monthlyIncome = gym.monthlyIncome.get(currentMonth) || { days: new Map() };
            const monthlyOutcome = gym.monthlyOutcome.get(currentMonth) || { days: new Map() };
            const monthlyRevenue = gym.monthlyRevenue.get(currentMonth) || { days: new Map() };

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
            if (!monthlyIncome.days.has(currentDate) {
                monthlyIncome.days.set(currentDate, dailyRecord);
                gym.monthlyIncome.set(currentMonth, monthlyIncome);
                needsUpdate = true;
            }

            if (!monthlyOutcome.days.has(currentDate)) {
                monthlyOutcome.days.set(currentDate, dailyRecord);
                gym.monthlyOutcome.set(currentMonth, monthlyOutcome);
                needsUpdate = true;
            }

            if (!monthlyRevenue.days.has(currentDate)) {
                monthlyRevenue.days.set(currentDate, dailyRecord);
                gym.monthlyRevenue.set(currentMonth, monthlyRevenue);
                needsUpdate = true;
            }

            // Calculate monthly totals
            if (needsUpdate) {
                const incomeTotals = Array.from(monthlyIncome.days.values()).reduce((acc, day) => acc + day.income, 0);
                const outcomeTotals = Array.from(monthlyOutcome.days.values()).reduce((acc, day) => acc + day.outcome, 0);
                const revenueTotals = Array.from(monthlyRevenue.days.values()).reduce((acc, day) => acc + day.revenue, 0);

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
            if (gym.monthlyIncome.size > 0) {
                const lastEntryMonth = Array.from(gym.monthlyIncome.keys()).pop();
                
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
