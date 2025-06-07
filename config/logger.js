const winston = require('winston');

// Enhanced logging configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'nutrition-system.log',
            level: 'error' // Ensure error level is captured
        }),
        new winston.transports.Console() // Also log to console
    ]
});

// Add error handling for the logger itself
logger.on('error', (err) => {
    console.error('Logger error:', err);
});

// Test the logger is working
logger.info('Logger initialized successfully');

module.exports = logger;