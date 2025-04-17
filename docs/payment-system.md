# Payment System Documentation

## Overview

The Aesthenda payment system provides a comprehensive solution for handling payments within the salon appointment booking workflow. It supports multiple payment providers (Stripe, Square, PayPal) and offers a complete admin interface for configuring payment settings and managing transactions.

## Components

### 1. Payment Provider Configuration

Located in the Admin Panel under the "Payment Settings" tab, this interface allows salon administrators to:

- Enable/disable online payments
- Select and configure payment providers (Stripe, Square, PayPal)
- Set up API keys and credentials for each provider
- Configure payment settings such as currency, service fees, and tax rates
- Test payment provider connections before going live

### 2. Payment Flow in Booking Process

The booking wizard includes a payment step that:

- Displays a summary of the appointment details and total cost
- Dynamically loads the appropriate payment interface based on the tenant's configuration
- Supports credit card payments through Stripe and Square
- Offers PayPal as an alternative payment method
- Provides a "Pay at salon" option when configured
- Handles payment processing errors gracefully
- Updates appointment status based on payment result

### 3. Payment Transaction Dashboard

The Payment Transaction Dashboard (`/dashboard/payments`) provides salon administrators with a comprehensive view of all payment transactions:

- Lists all payments with key information (date, customer, amount, status)
- Allows filtering by date range, payment status, and search terms
- Provides sorting capabilities for all columns
- Includes pagination for handling large datasets
- Enables direct access to detailed payment information
- Offers the ability to process refunds directly from the dashboard

### 4. Payment Detail View

The Payment Detail view (`/dashboard/payments/:paymentId`) shows comprehensive information about a specific payment:

- Payment amount, status, and method
- Associated appointment details
- Customer information
- Transaction timestamps (created, updated, refunded)
- Refund history and details
- Provider-specific transaction details
- Interface for processing full or partial refunds with reason tracking

## Technical Implementation

### Data Flow

1. When a client books an appointment, the system:
   - Creates the appointment record
   - Generates a payment intent via the selected provider
   - Processes the payment through the provider's API
   - Updates the appointment status based on payment result
   - Sends confirmation notifications

2. For payment management:
   - Transactions are stored in the database with references to appointments
   - The dashboard queries payments with filtering/sorting options
   - Refunds are processed through the provider API and recorded in the system

### Security Considerations

- Payment provider credentials are securely stored per tenant
- Only public keys are exposed to the client side
- All payment processing happens server-side or via secure provider SDKs
- PCI compliance is maintained by using provider-hosted payment forms
- Admin access to payment functions is restricted by role-based permissions

## Webhooks and Notifications

The system implements webhooks to handle asynchronous payment events:

- **Payment Provider Webhooks**: Dedicated endpoints for Stripe, Square, and PayPal
- **Signature Verification**: Secure webhook validation to prevent tampering
- **Event Processing**: Automatic handling of payment completions, failures, refunds, and disputes
- **Real-time Updates**: Payment status changes trigger updates to appointment status
- **Cross-Service Communication**: Events published via RabbitMQ to notify other services
- **Detailed Logging**: Comprehensive logging of webhook events for troubleshooting

For detailed webhook setup instructions, see [Payment Webhooks Documentation](payment-webhooks.md).

## Testing and Sandbox Environment

- Each payment provider includes sandbox/test mode functionality
- Test credentials can be used without processing real payments
- The "Test Connection" feature validates provider credentials
- Payment workflows can be fully tested in sandbox mode

## Future Improvements

- Real-time payment status updates via WebSockets
- Export functionality for payment reports
- Integration with accounting software
- Enhanced analytics on payment trends and revenue reporting
- Support for additional payment methods (Apple Pay, Google Pay) 