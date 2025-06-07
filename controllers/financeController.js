const Gym = require('../models/Gym');

// Helper functions
function getCurrentDayName() {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[new Date().getDay()];
}

function getCurrentWeekOfMonth() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const pastDaysOfMonth = (now - firstDayOfMonth) / (1000 * 60 * 60 * 24);
    return Math.min(3, Math.floor(pastDaysOfMonth / 7)); // Ensure it's 0-3
}

function createEmptyWeek() {
    return { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
}

function calculateDailyTotals(gym) {
    const income = gym.dailyIncome.reduce((sum, val) => sum + (val || 0), 0);
    const outcome = gym.dailyOutcome.reduce((sum, val) => sum + (val || 0), 0);
    const revenue = income - outcome;
    return { income, outcome, revenue };
}

// Validation middleware could be added here
exports.validateFinanceData = (req, res, next) => {
    const { email, income, outcome } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    if (typeof income !== 'number' || typeof outcome !== 'number' || income < 0 || outcome < 0) {
        return res.status(400).json({ message: 'Income and outcome must be positive numbers.' });
    }
    next();
};

exports.saveFinance = async (req, res) => {
    const { email, income, outcome } = req.body;
    
    try {
        const revenue = income - outcome;
        const updateResult = await Gym.findOneAndUpdate(
            { email },
            {
                $push: { dailyIncome: income, dailyOutcome: outcome },
                $inc: { dailyRevenue: revenue }
            },
            { upsert: true, new: true }
        );
        
        res.json({ 
            success: true,
            message: 'Finance data saved successfully.',
            data: {
                dailyIncome: updateResult.dailyIncome,
                dailyOutcome: updateResult.dailyOutcome,
                dailyRevenue: updateResult.dailyRevenue
            }
        });
    } catch (error) {
        console.error('Error saving finance data:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while saving finance data.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.updateFinanceCron = async () => {
    const dayName = getCurrentDayName();
    const weekOfMonth = getCurrentWeekOfMonth();
    
    try {
        const gyms = await Gym.find({});
        const bulkOps = [];
        const isEndOfMonthlyCycle = weekOfMonth === 3 && dayName === 'Sun';

        for (const gym of gyms) {
            const { income, outcome, revenue } = calculateDailyTotals(gym);
            const updateData = {
                $set: {
                    [`weeklyIncome.${weekOfMonth}.${dayName}`]: income,
                    [`weeklyExpense.${weekOfMonth}.${dayName}`]: outcome,
                    [`weeklyRevenue.${weekOfMonth}.${dayName}`]: revenue,
                    dailyIncome: [],
                    dailyOutcome: [],
                    dailyRevenue: 0
                }
            };

            if (isEndOfMonthlyCycle) {
                // Calculate monthly totals
                const monthlyIncome = gym.weeklyIncome.flatMap(week => 
                    Object.values(week)).reduce((sum, val) => sum + val, 0);
                const monthlyExpense = gym.weeklyExpense.flatMap(week => 
                    Object.values(week)).reduce((sum, val) => sum + val, 0);
                const monthlyRevenue = gym.weeklyRevenue.flatMap(week => 
                    Object.values(week)).reduce((sum, val) => sum + val, 0);

                // Add monthly data and reset weekly data
                updateData.$push = {
                    monthlyIncome: { $each: [monthlyIncome] },
                    monthlyExpense: { $each: [monthlyExpense] },
                    monthlyRevenue: { $each: [monthlyRevenue] }
                };

                updateData.$set.weeklyIncome = Array(4).fill().map(createEmptyWeek);
                updateData.$set.weeklyExpense = Array(4).fill().map(createEmptyWeek);
                updateData.$set.weeklyRevenue = Array(4).fill().map(createEmptyWeek);
            }

            bulkOps.push({
                updateOne: {
                    filter: { _id: gym._id },
                    update: updateData
                }
            });
        }

        if (bulkOps.length > 0) {
            await Gym.bulkWrite(bulkOps);
            console.log(`Successfully updated ${bulkOps.length} gym records for ${dayName}, week ${weekOfMonth + 1}`);
        } else {
            console.log('No gym records to update');
        }
    } catch (error) {
        console.error('Error in finance cron job:', error);
        // Consider adding error reporting here
    }
};