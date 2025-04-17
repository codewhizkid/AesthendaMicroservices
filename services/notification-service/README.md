# Notification Service

## Overview
The Notification Service is responsible for managing and sending notifications to users across multiple channels (email, SMS, push) based on events from other microservices in the Aesthenda platform.

## Features
- **Multi-channel Notifications**: Support for email, SMS, and push notifications
- **Event-driven Architecture**: Consumes events from RabbitMQ to trigger notifications
- **Template-based Content**: Uses Handlebars templates for consistent notification content
- **Multi-tenant Support**: All notifications are tenant-aware with customized branding
- **Dead Letter Handling**: Robust error handling with dead letter queues for failed messages

## Tools and Utilities
- **[Email Template Preview Tool](./docs/email-preview-tool.md)**: A built-in tool for previewing and testing email templates with different tenant brandings and appointment details
  - Now includes [authentication](../docs/email-preview-auth.md) to restrict access to authorized users
  - System admins can view templates for all tenants
  - Salon admins can only view templates for their own tenant

## SMS Notifications
The service supports SMS notifications via Twilio integration:

- **Testing SMS**: Use the included test script to verify your Twilio setup:
  ```bash
  # Inside the notification-service container
  node scripts/test-sms.js +15551234567  # Replace with an actual phone number
  ```

- **Twilio Configuration**: Set the following variables in the `.env` file:
  ```
  TWILIO_ACCOUNT_SID=your_account_sid
  TWILIO_AUTH_TOKEN=your_auth_token
  TWILIO_PHONE_NUMBER=your_twilio_phone_number
  ```

- **Mock Mode**: If Twilio credentials are missing or invalid, the service falls back to a mock implementation that logs messages instead of sending them.

## Preview Tool Authentication
The email preview tool now requires authentication:

- **Default Credentials**:
  - System Admin: admin@aesthenda.com / Admin123!
  - Salon Admin: salon@example.com / Salon123!

- **Authentication Endpoints**:
  - **POST /api/auth/login**: Authenticates user and returns a JWT token
  - **GET /api/preview/user-info**: Returns authenticated user information
  - **GET /api/preview/verify-token**: Validates authentication token

## Configuration
The service can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Port the service listens on | 5003 |
| RABBITMQ_URL | URL to connect to RabbitMQ | amqp://localhost |
| RABBITMQ_NOTIFICATION_QUEUE | Queue name for notifications | appointment_notifications |
| RABBITMQ_EVENTS_EXCHANGE | Exchange name for events | appointment_events |
| TWILIO_ACCOUNT_SID | Twilio Account SID | - |
| TWILIO_AUTH_TOKEN | Twilio Auth Token | - |
| TWILIO_PHONE_NUMBER | Twilio Phone Number | - |
| JWT_SECRET | Secret for JWT tokens | your_jwt_secret_key |

## API Endpoints
- **GET /health**: Health check endpoint
- **GET /api/preview/templates**: Get list of available email templates (authenticated)
- **POST /api/preview/email**: Generate preview of an email template (authenticated)
- **GET /api/preview/user-info**: Get authenticated user information (authenticated)
- **GET /api/preview/verify-token**: Validate authentication token (authenticated)
- **POST /api/auth/login**: Authenticate user and get JWT token

## Development
```bash
# Install dependencies
npm install

# Run the service locally
npm run dev

# Build and run with Docker
docker compose build notification-service
docker compose up -d notification-service
```

## Testing
Automated tests are available in the `/tests` directory.

## Integration
This service integrates with:
- **Appointment Service**: Consumes appointment-related events
- **Tenant Service**: Fetches tenant branding information
- **User Service**: Retrieves user contact details 