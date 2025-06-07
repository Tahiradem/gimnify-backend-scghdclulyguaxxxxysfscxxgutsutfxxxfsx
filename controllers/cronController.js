const cron = require('node-cron');
const financeController = require('./financeController');

const today = new Date();
const options = { weekday: 'short' };
const dayName = today.toLocaleDateString('en-US', options);

exports.scheduleFinanceUpdate = () => {
    cron.schedule('25 15 * * *', async () => {
        await financeController.updateFinanceCron();
    });
};