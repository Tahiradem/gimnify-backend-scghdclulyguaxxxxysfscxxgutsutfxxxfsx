const QRCodeService = require('../services/qrCodeService');
const Gym = require('../models/Gym');
const logger = require('../config/logger');

class QRCodeController {
  static async generateQRForAllUsers(req, res) {
    try {
      logger.info('Starting QR code generation for all users');
      
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

      res.status(200).json({
        success: true,
        message: 'QR code generation completed',
        totalProcessed,
        totalFailed
      });
    } catch (error) {
      logger.error('Error in QR code generation:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating QR codes',
        error: error.message
      });
    }
  }

  static async generateQRForSingleUser(req, res) {
    try {
      const { gymId, userId } = req.params;

      const gym = await Gym.findById(gymId);
      if (!gym) {
        return res.status(404).json({ success: false, message: 'Gym not found' });
      }

      const user = gym.users.id(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const qrCodeBase64 = await QRCodeService.generateQRForUser(user);
      
      // Update the user in the database
      await Gym.updateOne(
        { _id: gym._id, 'users._id': user._id },
        { $set: { 'users.$.qrCode': qrCodeBase64 } }
      );

      res.status(200).json({
        success: true,
        message: 'QR code generated successfully',
        qrCode: qrCodeBase64
      });
    } catch (error) {
      logger.error('Error generating QR for single user:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating QR code',
        error: error.message
      });
    }
  }

  static async getUserQRCode(req, res) {
    try {
      const { gymId, userId } = req.params;

      const gym = await Gym.findById(gymId);
      if (!gym) {
        return res.status(404).json({ success: false, message: 'Gym not found' });
      }

      const user = gym.users.id(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (!user.qrCode) {
        return res.status(404).json({ success: false, message: 'QR code not found for this user' });
      }

      res.status(200).json({
        success: true,
        qrCode: user.qrCode
      });
    } catch (error) {
      logger.error('Error fetching user QR code:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching QR code',
        error: error.message
      });
    }
  }

  static async handleQRScan(req, res) {
    try {
      const { qrData } = req.params;
      
      // Decode the QR code data
      const decodedData = await QRCodeService.decodeQRData(qrData);
      
      // Find the user in the database
      const gym = await Gym.findById(decodedData.gymId);
      if (!gym) {
        return res.status(404).json({ success: false, message: 'Gym not found' });
      }

      const user = gym.users.id(decodedData.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Return the user data
      res.status(200).json({
        success: true,
        user: {
          name: user.userName,
          email: user.email,
          phone: user.phone,
          membership: user.membershipDetail,
          lastUpdated: user.lastUpdated
        }
      });
    } catch (error) {
      logger.error('Error handling QR scan:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing QR code',
        error: error.message
      });
    }
  }
}

module.exports = QRCodeController;