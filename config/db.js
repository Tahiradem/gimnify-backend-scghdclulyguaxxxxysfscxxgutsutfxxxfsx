require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./logger');

// Enhanced MongoDB Connection Options
const mongoOptions = {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
  heartbeatFrequencyMS: 10000
};

const dbURI = process.env.MONGODB_URI || '';

if (!dbURI) {
  logger.error('MongoDB URI not found in environment variables');
  process.exit(1);
}

// Connection function with retry logic
const connectWithRetry = () => {
  mongoose.connect(dbURI, mongoOptions)
    .then(() => logger.info('Connected to MongoDB successfully'))
    .catch(err => {
      logger.error('MongoDB connection error:', err.message);
      logger.info('Retrying connection in 5 seconds...');
      setTimeout(connectWithRetry, 5000);
    });
};

connectWithRetry();

// Connection event handlers
const db = mongoose.connection;

db.on('error', err => {
  logger.error('MongoDB connection error:', err.message);
  if (err.message.includes('querySrv ETIMEOUT')) {
    logger.warn('DNS resolution failed - check your internet connection or DNS settings');
  }
});

db.on('disconnected', () => {
  logger.warn('MongoDB disconnected - attempting to reconnect...');
  connectWithRetry();
});

db.on('reconnected', () => logger.info('MongoDB reconnected'));
db.on('close', () => logger.warn('MongoDB connection closed'));

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = mongoose;