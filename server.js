require('dotenv').config();
const express = require('express');
const cron = require('node-cron');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const logger = require('./config/logger');
const axios = require('axios');
const QRCode = require('qrcode');

// Import models and routes
const Gym = require('./models/Gym');
const apiRoutes = require('./routes/api');
const userRoutes = require('./routes/userRoutes');
const financeRoutes = require('./routes/financeRoutes');
const emailRoutes = require('./routes/emailRoutes');
const gymRoutes = require('./routes/gymRoutes');
const cronRoutes = require('./routes/cronRoutes');
const updateDailyNotifications = require('./jobs/dailyNotificationJob');
const cronController = require('./controllers/cronController');
const revenueRoutes = require('./routes/revenue');
const monthlyRevenueRoutes = require('./routes/monthlyRevenueRoutes');
const qrCodeRoutes = require('./routes/qrCodeRoutes');
const attendanceRoutes = require('./routes/attendanceUpdaingRoutes');
const monthlyRevenueController = ('./controllers/monthlyRevenueController');

// AfroMessage SMS Configuration
const AFRO_TOKEN = process.env.AFRO_TOKEN || '';
const AFRO_FROM = process.env.AFRO_FROM || '';
const AFRO_SENDER = process.env.AFRO_SENDER || '';
const AFRO_CALLBACK = process.env.AFRO_CALLBACK || 'https://yourdomain.com/sms-status';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/scan-assets', express.static('public/scan-assets'));

// Database connection
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gimnify';
mongoose.connect(dbURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => {
    logger.info('Connected to MongoDB');
    // Remove the old QR generation call from here
})
.catch(err => logger.error('Error connecting to MongoDB:', err));

// QR Code Service
class QRCodeService {
    static async generateQRCode(data) {
        try {
            const qrDataURL = await QRCode.toDataURL(data);
            return qrDataURL;
        } catch (error) {
            logger.error('Error generating QR code:', error);
            throw error;
        }
    }

    static async generateQRForUser(user) {
        const data = JSON.stringify({
            userId: user._id.toString(),
            email: user.email,
            username: user.userName,
            phone: user.phone
        });
        return await this.generateQRCode(data);
    }

    static async decodeQRData(data) {
        try {
            return JSON.parse(data);
        } catch (error) {
            throw new Error('Invalid QR code data');
        }
    }
}

// Initialize cron job
cronController.scheduleFinanceUpdate();

// Add the new QR code generation cron job here
cron.schedule('*/5 * * * *', async () => {
    try {
        logger.info('Running scheduled QR code generation check');
        
        const gyms = await Gym.find({
            'users': {
                $elemMatch: {
                    qrCode: { $exists: false }
                }
            }
        });
        
        let totalProcessed = 0;
        let totalFailed = 0;

        for (const gym of gyms) {
            for (const user of gym.users.filter(u => !u.qrCode)) {
                try {
                    const qrCodeBase64 = await QRCodeService.generateQRForUser(user);
                    
                    await Gym.updateOne(
                        { _id: gym._id, 'users._id': user._id },
                        { $set: { 'users.$.qrCode': qrCodeBase64 } }
                    );
                    
                    totalProcessed++;
                    logger.info(`Generated QR code for ${user.email}`);
                } catch (error) {
                    totalFailed++;
                    logger.error(`Error generating QR for ${user.email}:`, error);
                }
            }
        }

        logger.info(`QR code generation completed. Processed: ${totalProcessed}, Failed: ${totalFailed}`);
    } catch (error) {
        logger.error('Error in QR code generation job:', error);
    }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/scan', express.static(path.join(__dirname, 'qr-scanner-pwa', 'public'), {
  index: 'index.html', // Explicitly serve index.html
  extensions: ['html'], // Default to .html files
}));

// Serve QR scanner PWA files with correct MIME types
app.use('/scan-assets', express.static(path.join(__dirname, 'qr-scanner-pwa', 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json');
        }
    }
}));

// QR Scanning Routes
const qrScanningRouter = require('./qr-scanner-pwa/routes/QrScannerAppRoutes');
app.use('/api/qrScanning', qrScanningRouter);

// Routes
app.use('/api', apiRoutes);
app.use(userRoutes);
app.use('/api', userRoutes); 
app.use(financeRoutes);
app.use(emailRoutes);
app.use(gymRoutes);
app.use(cronRoutes);
app.use('/revenue', monthlyRevenueRoutes);
app.use('/qrcodes', qrCodeRoutes);
app.use('/api', attendanceRoutes);

app.get('/scan*', (req, res) => {
    res.sendFile(path.join(__dirname, 'qr-scanner-pwa', 'public', 'index.html'));
});

// Bulk SMS Functionality
async function sendBulkNotifications() {
    try {
        logger.info('Starting bulk SMS notification process...');
        
        const gyms = await Gym.find({});
        let totalSent = 0;
        let totalFailed = 0;
        
        for (const gym of gyms) {
            for (const user of gym.users) {
                if (user.phone && user.TodayNotification) {
                    try {
                        const baseUrl = 'https://api.afromessage.com/api/send';
                        const params = new URLSearchParams({
                            from: AFRO_FROM,
                            sender: AFRO_SENDER,
                            to: user.phone,
                            message: user.TodayNotification,
                            callback: AFRO_CALLBACK,
                        });

                        const response = await axios.get(`${baseUrl}?${params.toString()}`, {
                            headers: {
                                Authorization: `Bearer ${AFRO_TOKEN}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        const { acknowledge } = response.data;

                        if (acknowledge === 'success') {
                            logger.info(`SMS sent successfully to ${user.phone}`);
                            totalSent++;
                        } else {
                            logger.error(`Failed to send SMS to ${user.phone}`);
                            totalFailed++;
                        }
                    } catch (error) {
                        logger.error(`Error sending to ${user.phone}:`, error.response?.data || error.message);
                        totalFailed++;
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }
        
        logger.info(`Bulk SMS completed. Success: ${totalSent}, Failed: ${totalFailed}`);
        return { success: totalSent, failed: totalFailed };
    } catch (error) {
        logger.error('Error in bulk notification process:', error);
        throw error;
    }
}

// SMS Sending Endpoint
app.post('/send-sms', async (req, res) => {
    const { to, message } = req.body;
    
    if (!to || !message) {
        return res.status(400).json({ error: 'Recipient and message are required' });
    }

    try {
        const baseUrl = 'https://api.afromessage.com/api/send';
        const params = new URLSearchParams({
            from: AFRO_FROM,
            sender: AFRO_SENDER,
            to,
            message,
            callback: AFRO_CALLBACK,
        });

        const response = await axios.get(`${baseUrl}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${AFRO_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });

        const { acknowledge, response: smsResponse } = response.data;

        if (acknowledge === 'success') {
            return res.json({ 
                status: 'success',
                message: 'SMS sent successfully',
                response: smsResponse 
            });
        } else {
            return res.status(500).json({ 
                status: 'error',
                message: 'Failed to send SMS',
                details: response.data 
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            status: 'error',
            message: 'Error sending SMS',
            details: error.response?.data || error.message 
        });
    }
});

// Monthly revenue cron jobs
cron.schedule('40 15 * * *', async () => {
    try {
        await monthlyRevenueController.checkAndUpdateMonthlyRevenue();
        logger.info('Monthly revenue check completed at month change');
    } catch (error) {
        logger.error('Error in monthly revenue cron job:', error);
    }
});

// Weekly check for monthly revenue
cron.schedule('0 0 * * 0', async () => {
    try {
        await monthlyRevenueController.checkAndUpdateMonthlyRevenue();
        logger.info('Weekly check of monthly revenue completed');
    } catch (error) {
        logger.error('Error in weekly revenue check:', error);
    }
});

// Enhanced scheduling with overlapping job prevention
let isJobRunning = false;

// Schedule bulk SMS at 12:00 AM every day
cron.schedule('45 19 * * *', async () => {
    if (isJobRunning) {
        logger.warn('Previous notification job still running - skipping this execution');
        return;
    }
    
    isJobRunning = true;
    try {
        const result = await sendBulkNotifications();
        logger.info(`Bulk SMS completed. Success: ${result.success}, Failed: ${result.failed}`);
    } catch (error) {
        logger.error('Error in bulk SMS job:', error);
    } finally {
        isJobRunning = false;
    }
});

// Test endpoint for bulk SMS
app.post('/test-bulk-sms', async (req, res) => {
    try {
        const result = await sendBulkNotifications();
        res.json({
            status: 'success',
            message: 'Test bulk SMS completed',
            result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error in test bulk SMS',
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    updateDailyNotifications().catch(err => logger.error('Initial update failed:', err));
});

// Enhanced shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received - shutting down gracefully');
    server.close(() => {
        mongoose.disconnect().then(() => {
            logger.info('Server and MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received - shutting down gracefully');
    server.close(() => {
        mongoose.disconnect().then(() => {
            logger.info('Server and MongoDB connection closed');
            process.exit(0);
        });
    });
});

// Global error handlers
process.on('uncaughtException', err => {
    logger.error('Uncaught exception:', err);
    server.close(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});