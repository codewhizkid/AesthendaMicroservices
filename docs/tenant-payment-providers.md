# Tenant Payment Provider Configuration

## Overview

The Aesthenda platform now allows each tenant (salon) to configure their own payment provider settings. This enables salons to use their existing payment processing accounts and receive payments directly, rather than going through a central platform payment processor.

## Supported Payment Providers

The system currently supports the following payment providers:

- **Stripe**: For credit card processing worldwide
- **Square**: Popular with small businesses, includes point-of-sale integration
- **PayPal**: For online payments with PayPal accounts
- **Mock**: A testing provider for development and demonstrations

## Configuration

### Accessing Payment Settings

Payment settings are available in the salon admin dashboard under:

Settings > Payments > Payment Providers

### General Settings

- **Active Payment Provider**: Choose which provider to use for processing payments
- **Payment Processing**: Enable/disable payment processing
- **Environment**: Toggle between test (sandbox) and production environments
- **Currency**: Set the default currency for transactions (e.g., USD, EUR)
- **Capture Method**: Choose between automatic capture or manual capture of payments
- **Service Fee**: Configure a platform service fee to add to transactions
- **Tax Settings**: Configure automatic tax calculation

### Stripe Configuration

To set up Stripe as a payment provider:

1. Create a [Stripe account](https://stripe.com)
2. Obtain API credentials from the Stripe Dashboard
3. Configure the following in Aesthenda:
   - **Public Key**: Your Stripe publishable key
   - **Secret Key**: Your Stripe secret key
   - **Account ID**: Your Stripe account ID (optional)
   - **Webhook Secret**: For validating Stripe webhook events (optional)

### Square Configuration

To set up Square as a payment provider:

1. Create a [Square account](https://squareup.com)
2. Create an application in the Square Developer Dashboard
3. Configure the following in Aesthenda:
   - **Application ID**: Your Square application ID
   - **Access Token**: Your Square API access token
   - **Location ID**: The Square location ID to use for transactions
   - **Webhook Signature Key**: For validating Square webhook events (optional)

### PayPal Configuration

To set up PayPal as a payment provider:

1. Create a [PayPal Business account](https://paypal.com)
2. Create an application in the PayPal Developer Dashboard
3. Configure the following in Aesthenda:
   - **Client ID**: Your PayPal REST API client ID
   - **Client Secret**: Your PayPal REST API client secret
   - **Merchant ID**: Your PayPal merchant ID

## Integration with Appointment Service

The payment service is integrated with the appointment booking workflow:

1. When a client books an appointment that requires payment, the system uses the salon's active payment provider
2. Payment details are processed directly through the tenant's payment account
3. The payment status is tracked in the appointment record
4. Refunds for canceled appointments can be processed through the same payment provider

## API Endpoints

### Tenant Configuration

- `GET /api/tenants/:tenantId/payment-config`: Get the current payment configuration
- `POST /api/tenants/:tenantId/payment-config`: Update payment configuration
- `POST /api/tenants/:tenantId/payment-config/validate`: Test and validate payment credentials

### Payment Processing

- `GET /api/tenants/:tenantId/payment-config/client`: Get client-side configuration
- `POST /api/tenants/:tenantId/payments`: Process a new payment
- `POST /api/tenants/:tenantId/payments/:paymentId/complete`: Complete a payment
- `POST /api/tenants/:tenantId/payments/:paymentId/refund`: Refund a payment
- `GET /api/tenants/:tenantId/payments/:paymentId`: Get payment status

## Security Considerations

- Payment credentials are stored securely with appropriate access controls
- Secret keys are never exposed to the client-side code
- Each tenant's payment data is isolated from other tenants
- All API endpoints that access or modify payment settings require authentication
- The system uses environment-specific credentials to separate test and production

## Implementation Details

The payment provider system is implemented with the following components:

1. **TenantPaymentConfig Model**: Stores tenant-specific payment provider settings
2. **TenantPaymentService**: Manages access to tenant payment configurations
3. **PaymentService**: Processes payments using tenant-specific providers
4. **Provider Implementations**: Integrations with Stripe, Square, and PayPal

Each payment provider follows a common interface for consistent integration:

```javascript
class PaymentProvider {
  async initialize() {}
  async createPaymentIntent(amount, currency, metadata) {}
  async processPayment(paymentIntentId, paymentMethodId) {}
  async refundPayment(paymentId, amount, reason) {}
  async getPaymentStatus(paymentId) {}
}
```

## Testing

You can test your payment provider configuration by:

1. Configuring your provider with test credentials
2. Setting the environment to "test"
3. Using the "Validate" button to verify your credentials
4. Creating a test appointment with payment
5. Using test card numbers or sandbox accounts to complete payment

Each provider offers test credentials for development:

- **Stripe**: Use test API keys and [test card numbers](https://stripe.com/docs/testing)
- **Square**: Use sandbox credentials and [test card numbers](https://developer.squareup.com/docs/testing/test-values)
- **PayPal**: Use sandbox accounts and [test credit cards](https://developer.paypal.com/tools/sandbox/card-testing/)

## Troubleshooting

Common issues and solutions:

- **Invalid Credentials**: Verify API keys are correct and from the right environment
- **Connection Failed**: Check network connectivity to the payment provider
- **Webhook Errors**: Ensure webhook URLs are correctly configured
- **Currency Mismatch**: Verify the account supports the selected currency
- **Test vs. Production**: Confirm you're using the right credentials for your environment 