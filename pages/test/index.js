const axios = require('axios');

// 🔐 Hardcoded AfroMessage Config
const AFRO_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiUWJSdnJPVW56Mng4OXJ3d2JDWEdGMmlwcllyUDRkOXoiLCJleHAiOjE5MDQwMTg3NTQsImlhdCI6MTc0NjI1MjM1NCwianRpIjoiZWQwYjcyNmUtOWU2NC00M2U3LTljODYtNWEyOTg3NjBjMDBmIn0.RaDgwxyWo-E5EQARb0X6Pfr9kekPgZ1IHizq3nOC--A';
const AFRO_FROM = 'e80ad9d8-adf3-463f-80f4-7c4b39f7f164';
const AFRO_SENDER = '';
const AFRO_CALLBACK = 'https://yourdomain.com/sms-status';

// Fixed recipient and message
const to = '251978787960';
const message = 'hello';

// Send SMS immediately
(async () => {
  const baseUrl = 'https://api.afromessage.com/api/send';
  const params = new URLSearchParams({
    from: AFRO_FROM,
    sender: AFRO_SENDER,
    to,
    message,
    callback: AFRO_CALLBACK,
  });

  try {
    console.log(`📤 Attempting to send SMS to ${to}...`);
    const response = await axios.get(`${baseUrl}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${AFRO_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const { acknowledge, response: smsResponse } = response.data;

    if (acknowledge === 'success') {
      console.log('✅ SMS sent successfully!');
      console.log('Response:', smsResponse);
    } else {
      console.log('❌ Failed to send SMS');
      console.log('Response:', response.data);
    }
  } catch (error) {
    console.log('⚠️ Error occurred:');
    console.error(error.response?.data || error.message);
  }
})();