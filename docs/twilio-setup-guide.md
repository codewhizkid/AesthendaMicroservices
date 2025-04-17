# Twilio SMS Integration Setup Guide

This guide walks you through the process of setting up Twilio SMS integration for the Aesthenda notification service.

## Prerequisites

- A credit card for Twilio account verification
- Admin access to the notification service environment variables

## Step 1: Create a Twilio Account

1. Go to [Twilio's website](https://www.twilio.com/try-twilio) and sign up for an account
2. Complete the verification process (email verification and phone verification)
3. Once verified, you'll be taken to the Twilio Console dashboard

## Step 2: Get Your Twilio Credentials

1. In the Twilio Console dashboard, locate your **Account SID** and **Auth Token**
   - The Account SID is clearly visible on the dashboard
   - Click "Show" to reveal your Auth Token

2. Keep these credentials secure - they provide full access to your Twilio account

## Step 3: Get a Twilio Phone Number

1. In the Twilio Console, navigate to "Phone Numbers" > "Manage" > "Buy a Number"
2. Search for a phone number with the following capabilities:
   - SMS enabled
   - In your country or region
3. Click "Buy" to purchase the number (Twilio numbers typically cost around $1/month plus usage fees)
4. Note down your new Twilio phone number

## Step 4: Update Environment Variables

Update the `.env` file in the notification service with your Twilio credentials:

```
TWILIO_ACCOUNT_SID=AC123...  # Replace with your actual Account SID
TWILIO_AUTH_TOKEN=auth123...  # Replace with your actual Auth Token
TWILIO_PHONE_NUMBER=+15551234567  # Replace with your Twilio phone number
```

## Step 5: Restart the Notification Service

```bash
docker compose restart notification-service
```

## Step 6: Verify the Configuration

1. Check the logs to confirm successful initialization:
   ```bash
   docker logs aesthendamicroservices-notification-service-1
   ```

2. Look for the message:
   ```
   SMS provider initialized successfully with Twilio
   ```

## Step 7: Test SMS Notifications

### Using the Testing Script

We've included a convenient testing script to verify your Twilio setup:

```bash
# Run from the project root directory
./services/notification-service/scripts/run-test-sms.sh +15551234567
```

Replace `+15551234567` with a real phone number to receive the test message.

### Testing with Real Appointments

1. Create or update an appointment through the API
2. Check if SMS notifications are sent
3. Verify in the Twilio Console under "Monitor" > "Logs" > "SMS"

## Troubleshooting

### SMS Provider Not Initialized

If you see "Failed to initialize Twilio client" in the logs:
- Verify your Account SID and Auth Token are correct
- Ensure your Twilio account is active and has a positive balance
- Check network connectivity to Twilio's API

### SMS Failing to Send

If SMS notifications are not being delivered:
- Check the phone number format (should be E.164 format: +{countrycode}{number})
- Verify the destination number is valid and can receive SMS
- Check Twilio logs for delivery status and any error messages
- Ensure your Twilio account has sufficient funds

## Twilio Pricing and Costs

- Twilio phone number: ~$1/month
- SMS messages: $0.0075 to $0.04 per message, depending on country
- No monthly minimums beyond the phone number cost
- Set up [usage triggers](https://www.twilio.com/docs/usage/tutorials/usage-triggers) in Twilio to avoid unexpected charges

## Next Steps

- Consider testing with a trial balance first
- Set up templated responses for different notification types
- Monitor delivery rates and adjust message content for better deliverability 