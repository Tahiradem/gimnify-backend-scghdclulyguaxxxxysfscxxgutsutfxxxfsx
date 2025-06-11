const axios = require('axios');
const Gym = require('../models/Gym');
const logger = require('../config/logger');
const cron = require('node-cron');  // Add this line at the top with other requires

// SMS Configuration
const smsConfig = {
  baseUrl: 'https://api.afromessage.com/api/send',
  token: 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiUWJSdnJPVW56Mng4OXJ3d2JDWEdGMmlwcllyUDRkOXoiLCJleHAiOjE5MDQwMTg3NTQsImlhdCI6MTc0NjI1MjM1NCwianRpIjoiZWQwYjcyNmUtOWU2NC00M2U3LTljODYtNWEyOTg3NjBjMDBmIn0.RaDgwxyWo-E5EQARb0X6Pfr9kekPgZ1IHizq3nOC--A',
  callback: 'https://yourdomain.com/sms-callback',
  from: 'e80ad9d8-adf3-463f-80f4-7c4b39f7f164',
  defaultSender: '',
  defaultCountryCode: '251', // Ethiopia
  batchSize: 10
};

// Helper function to format phone numbers
function formatPhoneNumber(phoneNumber, countryCode = smsConfig.defaultCountryCode) {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Ensure number starts with country code
  if (cleaned.startsWith(countryCode)) {
    return cleaned;
  }
  
  // If it starts with 0 (common in some countries), replace with country code
  if (cleaned.startsWith('0')) {
    return countryCode + cleaned.substring(1);
  }
  
  // Otherwise prepend country code
  return countryCode + cleaned;
}

// Send SMS in batches
const sendBatchSMS = async (recipients) => {
  try {
    const successfulSends = [];
    
    for (let i = 0; i < recipients.length; i += smsConfig.batchSize) {
      const batch = recipients.slice(i, i + smsConfig.batchSize);
      
      // Send individual SMS for each recipient (most SMS APIs don't support BCC like email)
      for (const user of batch) {
        const result = await sendSingleSMS(
          user.phoneNumber,
          user.notificationMessage || 'This is your daily notification!',
          smsConfig.defaultSender
        );
        
        if (result.success) {
          successfulSends.push(user.phoneNumber);
          logger.info(`SMS sent to ${user.phoneNumber}`);
        } else {
          logger.error(`Failed to send SMS to ${user.phoneNumber}: ${result.error}`);
        }
        
        // Small delay between sends to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return {
      success: true,
      sentCount: successfulSends.length,
      recipients: successfulSends
    };
  } catch (error) {
    logger.error("Error in sendBatchSMS:", error);
    throw error;
  }
};

// Send a single SMS
async function sendSingleSMS(to, message, sender = smsConfig.defaultSender) {
  const recipient = formatPhoneNumber(to);
  
  if (!recipient) {
    return {
      success: false,
      error: 'Invalid phone number format'
    };
  }

  const body = {
    callback: smsConfig.callback,
    from: smsConfig.from,
    sender: sender,
    to: recipient,
    message: message
  };

  const headers = {
    'Authorization': `Bearer ${smsConfig.token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    const response = await axios.post(smsConfig.baseUrl, body, { 
      headers, 
      timeout: 10000 
    });

    if (response.status === 200) {
      const data = response.data;
      
      if (data.acknowledge === 'success') {
        return { success: true, data };
      } else {
        const errorMsg = `API Error: ${data.message || 'Unknown error'}`;
        return { success: false, error: errorMsg };
      }
    } else {
      const errorMsg = `Unexpected HTTP Status: ${response.status}`;
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    let errorMsg = 'Failed to send SMS';
    
    if (error.response) {
      errorMsg = `API Error [${error.response.status}]: ${error.response.data?.message || 'No error details'}`;
    } else if (error.request) {
      errorMsg = 'No response from SMS server';
    } else {
      errorMsg = `Configuration Error: ${error.message}`;
    }

    return { success: false, error: errorMsg };
  }
}

// Get users with SMS notification time
async function getUsersWithSmsNotificationTime(gymName) {
  try {
    const gymData = await Gym.findOne({ email: gymName }).lean();
    if (!gymData) {
      logger.warn(`Gym not found: ${gymName}`);
      return [];
    }
    
    return gymData.users
      .filter(user => user.phoneNumber && user.smsNotificationTime)
      .map(user => ({
        userName: user.userName || 'User',
        phoneNumber: user.phoneNumber,
        notificationTime: user.smsNotificationTime,
        notificationMessage: user.TodayNotification || 'This is your daily notification!',
      }));
  } catch (error) {
    logger.error("Error in getUsersWithSmsNotificationTime:", error);
    return [];
  }
}

// Main function to check and send SMS
exports.checkAndSendSMS = async (gymName) => {
  try {
    const now = new Date();
    const currentTime = formatTimeForComparison(now);
    
    logger.info(`[${now.toISOString()}] Checking SMS notifications for ${gymName} at ${currentTime}`);
    
    const users = await getUsersWithSmsNotificationTime(gymName);
    if (users.length === 0) {
      logger.info('No users found with SMS notification preferences');
      return { success: false, message: 'No users found' };
    }
    
    const usersToNotify = users.filter(user => 
      formatTimeForComparison(user.notificationTime) === currentTime
    );
    
    if (usersToNotify.length === 0) {
      logger.info(`No users to notify via SMS at ${currentTime}`);
      return { success: true, message: 'No users to notify at this time' };
    }
    
    logger.info(`Found ${usersToNotify.length} users to notify via SMS`);
    const result = await sendBatchSMS(usersToNotify);
    
    return {
      success: true,
      message: `SMS notifications sent to ${result.sentCount} users`,
      details: result
    };
  } catch (error) {
    logger.error("Error in checkAndSendSMS:", error);
    return { success: false, error: error.message };
  }
};

// API endpoint handler
exports.sendSMS = async (req, res) => {
  try {
    const gymName = req.query.email;
    if (!gymName) {
      return res.status(400).json({
        success: false,
        message: "Gym email is required"
      });
    }
    
    const result = await this.checkAndSendSMS(gymName);
    
    if (result.success) {
      res.json({
        success: true,
        message: `SMS processing completed for ${gymName}`,
        details: result
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to process SMS notifications",
        error: result.error
      });
    }
  } catch (error) {
    logger.error("Error in sendSMS endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Add to your cron job setup
cron.schedule('38 15 * * *', async () => {
  if (isJobRunning) {
    logger.warn('Previous SMS job still running - skipping this execution');
    return;
  }
  
  isJobRunning = true;
  try {
    // Get all gyms that have SMS notifications enabled
    const gyms = await Gym.find({ smsNotificationsEnabled: true });
    
    for (const gym of gyms) {
      await exports.checkAndSendSMS(gym.email);
    }
  } catch (error) {
    logger.error('Unexpected error in SMS scheduled job:', error);
  } finally {
    isJobRunning = false;
  }
});