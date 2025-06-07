require('dotenv').config();
const mongoose = require('mongoose');
const QRCodeService = require('../services/qrCodeService');
const Gym = require('../models/Gym');
const logger = require('../config/logger');

async function generateQRCodesForAllUsers() {
  try {
    const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gimnify';
    await mongoose.connect(dbURI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    logger.info('Connected to MongoDB');

    logger.info('Starting QR code generation for all existing users...');
    
    const gyms = await Gym.find({});
    let totalProcessed = 0;
    let totalFailed = 0;

    for (const gym of gyms) {
      for (const user of gym.users) {
        try {
          if (!user.qrCode) {
            const qrCodeBase64 = await QRCodeService.generateQRForUser(user);
            
            // Update the user in the database
            await Gym.updateOne(
              { _id: gym._id, 'users._id': user._id },
              { $set: { 'users.$.qrCode': qrCodeBase64 } }
            );
            
            totalProcessed++;
            logger.info(`Generated QR code for ${user.email}`);
          }
        } catch (error) {
          totalFailed++;
          logger.error(`Error generating QR for ${user.email}:`, error);
        }
      }
    }

    logger.info(`QR code generation completed. Success: ${totalProcessed}, Failed: ${totalFailed}`);
    process.exit(0);
  } catch (error) {
    logger.error('Error in QR code generation script:', error);
    process.exit(1);
  }
}

generateQRCodesForAllUsers();