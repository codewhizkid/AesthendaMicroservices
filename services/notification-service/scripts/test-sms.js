/**
 * SMS Testing Script
 * 
 * This script tests the Twilio SMS integration.
 * Usage: node scripts/test-sms.js <phone_number>
 * 
 * Example: node scripts/test-sms.js +15551234567
 */

// Load environment variables from .env file
require('dotenv').config();

// Import the SMS provider
const { SMSProvider } = require('../providers/sms');

// Check if phone number was provided
if (process.argv.length < 3) {
  console.error('Error: Phone number is required');
  console.log('Usage: node scripts/test-sms.js <phone_number>');
  console.log('Example: node scripts/test-sms.js +15551234567');
  process.exit(1);
}

// Get the phone number from command line arguments
const phoneNumber = process.argv[2];

// Main function to test the SMS provider
async function testSMS() {
  console.log('SMS Testing Script');
  console.log('=================');
  console.log(`Target phone: ${phoneNumber}`);
  
  try {
    // Initialize the SMS provider
    const smsProvider = new SMSProvider();
    console.log('Initializing SMS provider...');
    await smsProvider.initialize();
    
    // Create a test message
    const testMessage = "This is a test SMS from Aesthenda Salon Management System. If you received this, SMS integration is working correctly!";
    
    console.log('Sending test SMS...');
    
    // Send the test message
    const result = await smsProvider.send({
      to: phoneNumber,
      message: testMessage
    });
    
    // Display the result
    console.log('SMS sent successfully!');
    console.log('Message SID:', result.sid);
    console.log('Status:', result.status);
    
    if (smsProvider.isMock) {
      console.log('\nNOTE: Running in MOCK MODE. No actual SMS was sent.');
      console.log('To send real SMS messages, configure your Twilio credentials in the .env file:');
      console.log('- TWILIO_ACCOUNT_SID');
      console.log('- TWILIO_AUTH_TOKEN');
      console.log('- TWILIO_PHONE_NUMBER');
    } else {
      console.log('\nSMS successfully sent using Twilio!');
      console.log('Check your phone for the test message.');
    }
    
    // Clean up
    await smsProvider.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('\nError testing SMS:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Verify your Twilio credentials are correct in .env');
    console.error('2. Ensure the phone number is in E.164 format (+15551234567)');
    console.error('3. Check that your Twilio account has sufficient funds');
    process.exit(1);
  }
}

// Run the test
testSMS(); 