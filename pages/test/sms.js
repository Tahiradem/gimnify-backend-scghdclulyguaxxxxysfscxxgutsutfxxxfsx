const axios = require('axios');

// Configuration - REPLACE THESE VALUES WITH YOUR ACTUAL CREDENTIALS
const config = {
  baseUrl: 'https://api.afromessage.com/api/send',
  token: 'eyJhbGciOiJIUzI1NiJ9.eyJpZGVudGlmaWVyIjoiUWJSdnJPVW56Mng4OXJ3d2JDWEdGMmlwcllyUDRkOXoiLCJleHAiOjE5MDQwMTg3NTQsImlhdCI6MTc0NjI1MjM1NCwianRpIjoiZWQwYjcyNmUtOWU2NC00M2U3LTljODYtNWEyOTg3NjBjMDBmIn0.RaDgwxyWo-E5EQARb0X6Pfr9kekPgZ1IHizq3nOC--A',
  callback: 'https://yourdomain.com/', // Your server's callback URL
  from: 'e80ad9d8-adf3-463f-80f4-7c4b39f7f164', // Approved sender ID from Afromessage
  defaultSender: '', // Fallback sender name
  defaultCountryCode: '251' // Ethiopia
};

// Function to send SMS
async function sendSMS(to, message, sender = config.defaultSender) {
  // Validate phone number (remove any + or spaces)
  const cleanedTo = to.replace(/[+\s]/g, '');
  
  // Ensure number starts with country code
  const recipient = cleanedTo.startsWith(config.defaultCountryCode) 
    ? cleanedTo 
    : config.defaultCountryCode + cleanedTo;

  // Request body
  const body = {
    callback: config.callback,
    from: config.from,
    sender: sender,
    to: recipient,
    message: message
  };

  // Headers
  const headers = {
    'Authorization': `Bearer ${config.token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    console.log('Attempting to send SMS to:', recipient);
    const response = await axios.post(config.baseUrl, body, { headers, timeout: 10000 });

    if (response.status === 200) {
      const data = response.data;
      
      if (data.acknowledge === 'success') {
        console.log('SMS sent successfully!');
        console.log('Response:', data);
        return { success: true, data };
      } else {
        const errorMsg = `API Error: ${data.message || 'Unknown error'}`;
        console.error(errorMsg);
        return { success: false, error: errorMsg };
      }
    } else {
      const errorMsg = `Unexpected HTTP Status: ${response.status} - ${response.statusText}`;
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    let errorMsg = 'Failed to send SMS';
    
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      errorMsg = `API Error [${error.response.status}]: ${error.response.data?.message || JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      // No response received
      errorMsg = 'No response from server - Check your network connection';
    } else {
      // Other errors
      errorMsg = `Configuration Error: ${error.message}`;
    }

    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}

// Example usage
(async () => {
  const phoneNumber = '251978787960'; // Ethiopian number (without +)
  const message = 'Hello from Afromessage API!';
  
  const result = await sendSMS(phoneNumber, message, ''); // Custom sender
  
  if (!result.success) {
    console.error('\nSMS FAILED! Please check:');
    console.error('1. Your API token is valid and not expired');
    console.error('2. Your sender ID is approved by Afromessage');
    console.error('3. Your callback URL is accessible');
    console.error('4. You have sufficient balance');
    console.error('5. The recipient number is correct');
  }
})();