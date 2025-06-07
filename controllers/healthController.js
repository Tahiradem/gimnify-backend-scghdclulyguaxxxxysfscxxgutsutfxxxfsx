const mongoose = require('../config/db');

const healthCheck = (req, res) => {
    res.status(200).json({
        status: 'healthy',
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        memoryUsage: process.memoryUsage()
    });
};

module.exports = {
    healthCheck
};