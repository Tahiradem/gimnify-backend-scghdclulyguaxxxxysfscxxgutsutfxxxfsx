const Gym = require('../models/Gym');
const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 587,
    secure: false,
    auth: {
        user: "8094fa001@smtp-brevo.com",
        pass: "LBTAcWHDtvxJZgkP",
    },
});

// Email template configuration
const mailOptionsTemplate = {
    from: '"Gimnify App" <gimnifyapp@gmail.com>',
    subject: "Good Morning",
};

// Helper function to standardize time format
function formatTimeForComparison(dateString) {
    if (!dateString) return '';
    
    // Handle both Date objects and time strings
    const date = typeof dateString === 'string' 
        ? new Date(`1970-01-01 ${dateString}`)
        : dateString;
        
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
    .toUpperCase()
    .replace(/^(\d:\d\d)/, '0$1') // Add leading zero if needed
    .replace(/\s/g, ''); // Remove all whitespace
}

// Send emails in batches
const sendBatchEmails = async (recipients) => {
    try {
        const batchSize = 50; // Brevo's recommended batch size
        const successfulSends = [];
        
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            const mailOptions = {
                ...mailOptionsTemplate,
                bcc: batch.map(user => user.email),
                html: `<p>Good morning ${batch.map(u => u.userName).join(', ')}!<br>${batch[0]?.notificationMessage || 'This is your daily notification!'}</p>`,
            };
            
            const info = await transporter.sendMail(mailOptions);
            successfulSends.push(...batch.map(u => u.email));
            console.log(`Sent batch ${i/batchSize + 1} to ${batch.length} users`);
        }
        
        return {
            success: true,
            sentCount: successfulSends.length,
            recipients: successfulSends
        };
    } catch (error) {
        console.error("Error in sendBatchEmails:", error);
        throw error;
    }
};

// Get users with notification time
async function getUsersWithNotificationTime(gymName) {
    try {
        const gymHouseData = await Gym.findOne({ email: gymName }).lean();
        if (!gymHouseData) {
            console.log(`Gym not found: ${gymName}`);
            return [];
        }
        
        return gymHouseData.users
            .filter(user => user.email && user.notificationTime)
            .map(user => ({
                userName: user.userName || 'User',
                email: user.email,
                notificationTime: user.notificationTime,
                notificationMessage: user.TodayNotification || 'This is your daily notification!',
            }));
    } catch (error) {
        console.error("Error in getUsersWithNotificationTime:", error);
        return [];
    }
}

// Main function to check and send emails
exports.checkAndSendEmails = async (gymName) => {
    try {
        const now = new Date();
        const currentTime = formatTimeForComparison(now);
        
        console.log(`[${now.toISOString()}] Checking notifications for ${gymName} at ${currentTime}`);
        
        const users = await getUsersWithNotificationTime(gymName);
        if (users.length === 0) {
            console.log('No users found with notification preferences');
            return { success: false, message: 'No users found' };
        }
        
        const usersToNotify = users.filter(user => 
            formatTimeForComparison(user.notificationTime) === currentTime
        );
        
        if (usersToNotify.length === 0) {
            console.log(`No users to notify at ${currentTime}`);
            return { success: true, message: 'No users to notify at this time' };
        }
        
        console.log(`Found ${usersToNotify.length} users to notify`);
        const result = await sendBatchEmails(usersToNotify);
        
        return {
            success: true,
            message: `Notifications sent to ${result.sentCount} users`,
            details: result
        };
    } catch (error) {
        console.error("Error in checkAndSendEmails:", error);
        return { success: false, error: error.message };
    }
};

// API endpoint handler
exports.sendEmail = async (req, res) => {
    try {
        const gymName = req.query.email;
        if (!gymName) {
            return res.status(400).json({
                success: false,
                message: "Gym email is required"
            });
        }
        
        const result = await this.checkAndSendEmails(gymName);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Email processing completed for ${gymName}`,
                details: result
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to process notifications",
                error: result.error
            });
        }
    } catch (error) {
        console.error("Error in sendEmail endpoint:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};