# Twilio SMS Integration Guide

This document outlines the integration of Twilio SMS capabilities with the Notification Service.

## Overview

The notification service uses Twilio to send SMS notifications to users. The implementation supports:
- Authentication with Twilio API credentials
- Automatic formatting of phone numbers
- Graceful fallback to a mock implementation during development
- Error handling and logging

## Configuration

### Environment Variables

To enable Twilio SMS functionality, you need to set the following environment variables:

```
TWILIO_ACCOUNT_SID=AC00000000000000000000000000000000  # Your Twilio Account SID
TWILIO_AUTH_TOKEN=your_twilio_auth_token                # Your Twilio Auth Token
TWILIO_PHONE_NUMBER=+15555555555                       # Your Twilio Phone Number
```

These can be set in:
- The `.env` file (for local development)
- Docker Compose configuration
- Kubernetes secrets (for production)

### Mock Mode

If any of the required Twilio credentials are missing, the service will automatically fall back to a mock implementation. This allows for development and testing without actual SMS delivery.

When in mock mode:
- SMS messages are logged instead of sent
- No API calls to Twilio are made
- Message content is displayed in console logs

## Usage

The SMS provider is integrated into the notification service and used when sending appointment notifications:

```javascript
// Example usage within the notification service
await smsProvider.send({
  to: '+15551234567',
  message: 'Your appointment has been confirmed for June 15th at 2:00 PM.'
});
```

## Phone Number Formatting

The SMS provider includes a utility function to standardize phone number formats:

```javascript
formatPhoneNumber(phoneNumber) {
  // Remove any non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Ensure number starts with country code
  if (!cleaned.startsWith('1')) {
    return `+1${cleaned}`;
  }
  return `+${cleaned}`;
}
```

This ensures that phone numbers are properly formatted for Twilio, regardless of the input format.

## Getting Twilio Credentials

1. **Create a Twilio Account**:
   - Visit [Twilio's website](https://www.twilio.com) and sign up
   - Verify your account with a phone number and email

2. **Get Your Credentials**:
   - Log in to your Twilio account
   - Navigate to the Dashboard
   - Your Account SID and Auth Token will be displayed
   - Note: Keep your Auth Token secure!

3. **Get a Phone Number**:
   - In the Twilio Dashboard, go to "Phone Numbers" > "Buy a Number"
   - Purchase a number with SMS capabilities
   - This will be your `TWILIO_PHONE_NUMBER`

## Troubleshooting

### Common Issues

1. **"Username is required" Error**:
   - Make sure `TWILIO_ACCOUNT_SID` is set correctly
   - Check that it starts with "AC"

2. **Authentication Failed**:
   - Verify your Auth Token is correct
   - Make sure your Twilio account is active and has sufficient funds

3. **Invalid Phone Number Format**:
   - Ensure phone numbers include country codes
   - The service will attempt to format US/Canada numbers automatically

### Testing

To verify your Twilio setup is working:

1. Set all required environment variables
2. Check the logs for "SMS provider initialized successfully with Twilio"
3. Create a test appointment through the API
4. Verify the notification was sent in the Twilio console

## Further Enhancements

Future improvements could include:
- Support for international phone numbers
- SMS templates for different notification types
- SMS delivery status tracking
- Rate limiting to prevent API overuse 