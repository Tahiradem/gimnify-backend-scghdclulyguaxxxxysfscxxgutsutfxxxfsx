const Gym = require('../models/Gym');
const axios = require('axios');
const cron = require('node-cron');

// SMS Service Configuration
const SMS_CONFIG = {
  apiKey: process.env.AFRO_TOKEN,
  senderId: process.env.AFRO_FROM,
  apiUrl: 'https://api.afromessage.com/api/send',  // ✅ correct API base + endpoint
  localApiUrl: 'http://localhost:5001/sending-sms'
};

// Normalize date (remove time component)
function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Main expiry check function
exports.checkMembershipExpirations = async () => {
  try {
    const gyms = await Gym.find({});
    const today = normalizeDate(new Date());
    const oneWeekLater = new Date(today);
    oneWeekLater.setDate(today.getDate() + 7);

    let remindersSent = 0;

    for (const gym of gyms) {
      for (const user of gym.users) {
        if (!user.membershipDetail?.length) continue;

        const latestMembership = user.membershipDetail.slice(-1)[0];
        if (!user.paymentDate) continue;

        const pkgLen = parseInt(latestMembership.packageLength);
        if (isNaN(pkgLen)) continue;

        const expiryDate = normalizeDate(new Date(user.paymentDate));
        expiryDate.setMonth(expiryDate.getMonth() + pkgLen);

        if (expiryDate > today && expiryDate <= oneWeekLater) {
          let phone = user.phone;
          if (phone.startsWith("0")) {
            phone = "+251" + phone.slice(1);
          }

          const message = `Dear ${user.userName}, your ${latestMembership.planName} membership at ${gym.name} expires on ${expiryDate.toDateString()}. Please renew.`;

          console.log(`[CHECK] ${user.userName} – Expiry: ${expiryDate.toDateString()}, Phone: ${phone}`);

          const success = await sendSMS(phone, message);
          console.log(`[SMS RESULT] Sent: ${success}`);

          if (success) {
            remindersSent++;
            user.lastPaymentReminder = new Date();
            await gym.save();
          }
        }
      }
    }

    console.log(`✅ Payment reminders: ${remindersSent} sent`);
    return { success: true, remindersSent };

  } catch (err) {
    console.error("❌ Error in checkMembershipExpirations:", err);
    return { success: false, error: err.message };
  }
};

const sendSMS = async (to, message) => {
  try {
    const response = await axios.get(SMS_CONFIG.apiUrl, {
      headers: {
        Authorization: `Bearer ${SMS_CONFIG.apiKey}`
      },
      params: {
        to,
        message
      }
    });

    if (response.data.success) {
      console.log('✅ SMS sent successfully');
      return true;
    } else {
      console.log('❌ SMS failed to send:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ SMS sending failed:', error.response?.data || error.message);
    return false;
  }
};


// Manual endpoint for quick testing
exports.sendManualSMS = async (req, res) => {
  try {
    const phone = req.body.phone || "0978787960";
    const message = req.body.message || "hi";

    let formatted = phone;
    if (formatted.startsWith("0")) {
      formatted = "+251" + formatted.slice(1);
    }

    const resp = await axios.get(SMS_CONFIG.apiUrl, {
      params: {
        to: formatted,
        message,
        from: SMS_CONFIG.senderId,
        key: SMS_CONFIG.apiKey,
      }
    });

    console.log("Manual SMS API:", resp.data);
    res.status(200).json({ success: true, data: resp.data });

  } catch (err) {
    console.error("❌ Manual SMS Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Cron schedule at 6:55 AM server time
cron.schedule('0 2 * * *', exports.checkMembershipExpirations);
