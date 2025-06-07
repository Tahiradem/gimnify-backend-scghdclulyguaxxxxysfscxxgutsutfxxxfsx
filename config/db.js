require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const logger = require('./logger');

// MongoDB Connection with enhanced settings
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 5000,
    retryWrites: true,
    retryReads: true
};

// Use environment variable with fallback
const dbURI = process.env.MONGODB_URI || '';

mongoose.connect(dbURI, mongoOptions)
  .then(() => logger.info('Connected to MongoDB successfully'))
  .catch(err => logger.error('MongoDB connection error:', err));

const db = mongoose.connection;
db.on('error', err => logger.error('MongoDB connection error:', err));
db.on('reconnected', () => logger.info('MongoDB reconnected'));
db.on('disconnected', () => logger.warn('MongoDB disconnected'));

module.exports = mongoose;