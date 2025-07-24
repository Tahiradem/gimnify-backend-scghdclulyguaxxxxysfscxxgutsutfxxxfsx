const axios = require('axios');
const Gym = require('../models/Gym');

// Configuration
const AFRO_CONFIG = {
    token: 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiS28xYXp6ODZyRW56bXNWbUZtVVd6NU55TklvOWJYbnEiLCJleHAiOjE5MTA0NjUyMTYsImlhdCI6MTc1MjY5ODgxNiwianRpIjoiYzUwZWZhNTQtNDdiYS00ODFkLWJiM2UtOTlkZDliYjUzNThlIn0.ESHRvf1Dr_Q0tbZp_zMQxky5PZj4hWnY--nG1UV5Beo',
    from: 'e80ad9d8-adf3-463f-80f4-7c4b39f7f164',
    sender: '',
    callback: 'https://yourdomain.com/sms-status',
    baseUrl: 'https://api.afromessage.com/api/send'
};

// Helper function to standardize time format (same as email system)
function formatTimeForComparison(dateString) {
    if (!dateString) return '';
    
    const date = typeof dateString === 'string' 
        ? new Date(`1970-01-01 ${dateString}`)
        : dateString;
        
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
    .toUpperCase()
    .replace(/^(\d:\d\d)/, '0$1')
    .replace(/\s/g, '');
}

// Send SMS to a single recipient
const sendSingleSms = async (to, message) => {
    try {
        const params = new URLSearchParams({
            from: AFRO_CONFIG.from,
            sender: AFRO_CONFIG.sender,
            to,
            message,
            callback: AFRO_CONFIG.callback,
        });

        const response = await axios.get(`${AFRO_CONFIG.baseUrl}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${AFRO_CONFIG.token}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
};

// Send SMS in batches
const sendBatchSms = async (recipients) => {
    try {
        const batchSize = 10; // Adjust based on API limits
        const successfulSends = [];
        
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            
            // Send each SMS individually (since AfroMessage API doesn't support BCC)
            for (const user of batch) {
                try {
                    const result = await sendSingleSms(
                        user.phone, 
                        user.notificationMessage || 'This is your daily notification!'
                    );
                    
                    if (result.acknowledge === 'success') {
                        successfulSends.push(user.phone);
                    }
                } catch (error) {
                    console.error(`Failed to send to ${user.phone}:`, error.message);
                }
            }
            
            console.log(`Processed batch ${i/batchSize + 1} with ${batch.length} users`);
        }
        
        return {
            success: true,
            sentCount: successfulSends.length,
            recipients: successfulSends
        };
    } catch (error) {
        console.error("Error in sendBatchSms:", error);
        throw error;
    }
};

// Get users with SMS notification time
async function getUsersWithSmsNotification(gymName) {
    try {
        const gymData = await Gym.findOne({ email: gymName }).lean();
        if (!gymData) {
            console.log(`Gym not found: ${gymName}`);
            return [];
        }
        
        return gymData.users
            .filter(user => user.phone && user.smsNotificationTime)
            .map(user => ({
                userName: user.userName || 'User',
                phone: user.phone,
                notificationTime: user.smsNotificationTime,
                notificationMessage: user.TodayNotification || 'This is your daily SMS notification!',
            }));
    } catch (error) {
        console.error("Error in getUsersWithSmsNotification:", error);
        return [];
    }
}

// Main function to check and send SMS
exports.checkAndSendSms = async (gymName) => {
    try {
        const now = new Date();
        const currentTime = formatTimeForComparison(now);
        
        console.log(`[${now.toISOString()}] Checking SMS notifications for ${gymName} at ${currentTime}`);
        
        const users = await getUsersWithSmsNotification(gymName);
        if (users.length === 0) {
            console.log('No users found with SMS notification preferences');
            return { success: false, message: 'No users found' };
        }
        
        const usersToNotify = users.filter(user => 
            formatTimeForComparison(user.notificationTime) === currentTime
        );
        
        if (usersToNotify.length === 0) {
            console.log(`No users to notify via SMS at ${currentTime}`);
            return { success: true, message: 'No users to notify at this time' };
        }
        
        console.log(`Found ${usersToNotify.length} users to notify via SMS`);
        const result = await sendBatchSms(usersToNotify);
        
        return {
            success: true,
            message: `SMS notifications sent to ${result.sentCount} users`,
            details: result
        };
    } catch (error) {
        console.error("Error in checkAndSendSms:", error);
        return { success: false, error: error.message };
    }
};