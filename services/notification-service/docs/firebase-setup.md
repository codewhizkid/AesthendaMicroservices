# Firebase Push Notification Configuration

This document outlines the Firebase Cloud Messaging (FCM) integration with the Notification Service.

## Overview

The Notification Service uses Firebase Admin SDK to send push notifications to user devices. The implementation supports:
- Loading credentials from a service account JSON file
- Fallback to environment variables when the file is not available
- Mock implementation for development environments
- Multi-device notification delivery

## Files & Components

### 1. Push Notification Provider

The main implementation is in `providers/push.js`, which handles:
- Firebase Admin SDK initialization
- Credential management and fallback logic
- Sending notifications to multiple user devices
- Error handling and invalid token management

### 2. Configuration Files

#### Service Account

Firebase credentials are stored in `.firebase/service-account.json` with this structure:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk@your-project.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

#### Environment Variables

The following environment variables can be used:
- `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to the service account JSON file
- `FIREBASE_DATABASE_URL`: Firebase database URL
- `FIREBASE_PROJECT_ID`: Project ID (used as fallback if file not available)
- `FIREBASE_CLIENT_EMAIL`: Client email (used as fallback)
- `FIREBASE_PRIVATE_KEY`: Private key (used as fallback)
- `MOCK_USER_TOKENS`: Comma-separated list of FCM tokens for testing

## Docker Setup

The Docker configuration includes:
1. A dedicated volume mount for the Firebase credentials
2. Environment variables passed to the container
3. Directory structure creation in the Dockerfile

## Integration Points

### Sending Notifications

To send push notifications from the service:

```javascript
const { pushProvider } = require('./providers/push');

// Send a notification to a user
await pushProvider.send({
  userId: 'user123',
  title: 'Appointment Confirmation',
  body: 'Your appointment has been confirmed.',
  data: {
    appointmentId: 'appointment123',
    type: 'confirmation'
  }
});
```

## Implementation To-Do

To complete the implementation:

1. **Create a Firebase Project**:
   - Go to the Firebase Console (https://console.firebase.google.com/)
   - Create a new project
   - Navigate to Project Settings > Service Accounts
   - Generate a new private key and download the JSON file
   - Replace the placeholder `.firebase/service-account.json` with this file

2. **Implement Token Management**:
   - Add database schema for storing user FCM tokens
   - Update `getUserTokens()` to fetch tokens from the database
   - Implement `removeInvalidTokens()` to clean up invalid tokens

3. **Setup Client Apps**:
   - Configure Firebase in client applications
   - Implement token registration with the notification service
   - Add notification handling in the client apps

## Testing

For development testing:
- Use the mock implementation which simulates sending notifications
- Set `MOCK_USER_TOKENS` environment variable for testing with specific tokens
- Check logs for "MOCK: Push notification would be sent:" messages 