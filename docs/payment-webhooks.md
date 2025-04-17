# Payment Provider Webhooks

## Overview

Aesthenda supports webhooks from Stripe, Square, and PayPal to handle asynchronous payment events. Webhooks allow these payment providers to notify our system about events like successful payments, refunds, disputes, and more, enabling real-time updates to appointment statuses and payment records.

## Webhook Integration Architecture

1. **Payment Provider Triggers Event**: When an event occurs (payment completed, refund issued, etc.), the payment provider sends a webhook notification to our system.

2. **Request Validation**: We validate the webhook signature using the provider's security mechanisms to ensure the request is legitimate.

3. **Event Processing**: The system identifies the event type and tenant, then processes the event accordingly.

4. **Data Updates**: Payment records are updated based on the event data, and events are published to RabbitMQ.

5. **Cross-Service Notifications**: Other services (e.g., appointment service) respond to these events, updating appointment statuses and triggering notifications.

## Webhook Endpoints

Each payment provider has a dedicated webhook endpoint:

- **Stripe**: `/api/webhooks/stripe/:tenantId`
- **Square**: `/api/webhooks/square/:tenantId`
- **PayPal**: `/api/webhooks/paypal/:tenantId`

The `tenantId` parameter allows the system to process webhooks for each tenant independently.

## Provider-Specific Setup

### Stripe Webhook Setup

1. **Log in** to your [Stripe Dashboard](https://dashboard.stripe.com/).

2. **Navigate** to Developers > Webhooks.

3. **Add Endpoint**:
   - Set URL to: `https://your-domain.com/api/webhooks/stripe/{your-tenant-id}`
   - Select events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
     - `charge.dispute.created`

4. **After creating** the webhook, copy the "Signing Secret" provided by Stripe.

5. **Update your tenant configuration** in Aesthenda:
   - Go to Payment Settings
   - Under Stripe configuration, add the Webhook Secret Key

### Square Webhook Setup

1. **Log in** to your [Square Developer Dashboard](https://developer.squareup.com/apps).

2. **Select your application**.

3. **Navigate** to Webhooks.

4. **Add Endpoint**:
   - Set URL to: `https://your-domain.com/api/webhooks/square/{your-tenant-id}`
   - Select events to subscribe to:
     - `payment.updated`
     - `refund.updated`
     - `dispute.created`

5. **After creating** the webhook, copy the "Signature Key" provided by Square.

6. **Update your tenant configuration** in Aesthenda:
   - Go to Payment Settings
   - Under Square configuration, add the Webhook Signature Key

### PayPal Webhook Setup

1. **Log in** to your [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/).

2. **Navigate** to your app or create a new one.

3. **Go to Webhooks** under the app settings.

4. **Add Webhook**:
   - Set URL to: `https://your-domain.com/api/webhooks/paypal/{your-tenant-id}`
   - Select events to listen for:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DECLINED`
     - `PAYMENT.CAPTURE.REFUNDED`
     - `CUSTOMER.DISPUTE.CREATED`

5. **After creating** the webhook, note the Webhook ID.

6. **Update your tenant configuration** in Aesthenda:
   - Go to Payment Settings
   - Under PayPal configuration, add the Webhook ID

## Security Considerations

### 1. Signature Verification

All incoming webhooks are verified for authenticity using provider-specific signature verification mechanisms:

- **Stripe**: Uses the `stripe-signature` header and the webhook secret
- **Square**: Uses the `x-square-hmacsha256-signature` header and signature key
- **PayPal**: Uses multiple headers for verification

### 2. Rate Limiting

Webhook endpoints are protected by rate limiting to prevent abuse.

### 3. Error Handling

Failed webhook processing is logged for monitoring and debugging purposes.

## Event Types Handled

### Stripe Events

- `payment_intent.succeeded`: Updates payment status to completed
- `payment_intent.payment_failed`: Updates payment status to failed
- `charge.refunded`: Updates payment status to refunded
- `charge.dispute.created`: Records dispute information

### Square Events

- `payment.updated`: Updates payment status based on Square's status
- `refund.updated`: Updates payment status to refunded if completed
- `dispute.created`: Records dispute information

### PayPal Events

- `PAYMENT.CAPTURE.COMPLETED`: Updates payment status to completed
- `PAYMENT.CAPTURE.DECLINED`: Updates payment status to failed
- `PAYMENT.CAPTURE.REFUNDED`: Updates payment status to refunded
- `CUSTOMER.DISPUTE.CREATED`: Records dispute information

## Testing Webhooks

### Local Development Testing

For local development, we recommend using tools like [ngrok](https://ngrok.com/) to expose localhost to the internet temporarily:

1. Start your development server: `npm start`
2. Start ngrok: `ngrok http 5004` (assuming payment service runs on port 5004)
3. Use the ngrok URL as your webhook endpoint in the provider dashboard

### Test Mode

All payment providers support test/sandbox modes:

1. Configure your payment provider in test/sandbox mode
2. Make test payments or trigger test events from the provider's dashboard
3. Verify that webhooks are received and processed correctly

### Webhook Logs

When testing webhooks, check the logs for successful receipt and processing:

```
Processing Stripe event: payment_intent.succeeded for tenant tenant123
Updated payment 612345678901234567890123 status to completed
```

## Troubleshooting

### Common Issues

1. **Webhook not received**:
   - Verify the endpoint URL is correct
   - Check that your server is accessible from the internet
   - Verify the event types are correctly selected

2. **Signature verification failure**:
   - Ensure the webhook secret/key is correctly entered in your tenant configuration
   - Check for any modifications to the payload in transit (proxies, etc.)

3. **Event processing errors**:
   - Check logs for detailed error messages
   - Verify the payment record exists in your database
   - Ensure tenantId in the URL matches the configuration

## Webhook Event Monitoring

### Webhook Event Viewer

Aesthenda includes a comprehensive webhook event viewer in the admin interface, accessible at `/dashboard/webhook-events`. This tool provides:

- Real-time visibility into all webhook events received from payment providers
- Detailed tracking of event processing status (received, processed, failed, invalid signature)
- Filtering by provider, status, and date range
- Detailed view of event payloads and processing errors
- The ability to retry failed webhook events

This viewer is valuable for troubleshooting payment issues, validating webhook configuration, and providing transparency into the webhook processing pipeline.

### Event Logging

All incoming webhook events are automatically logged to the database, regardless of whether they are successfully processed. Each webhook event log includes:

- Event metadata (provider, event type, event ID, received time)
- Processing status and any error messages
- Related record IDs (payment, appointment, customer)
- Complete request headers and payload
- IP address of the sender

This comprehensive logging ensures that even if there are issues with webhook processing, no events are lost, and the system maintains a complete audit trail.

### Test Webhook Endpoints

During development, Aesthenda provides endpoints for generating test webhook events:

- `POST /api/test-webhooks/stripe`: Generate a test Stripe webhook event
- `POST /api/test-webhooks/square`: Generate a test Square webhook event
- `POST /api/test-webhooks/paypal`: Generate a test PayPal webhook event
- `GET /api/test-webhooks/options`: Get available event types and options

These endpoints simulate real webhook events from payment providers, allowing developers to test webhook processing without having to set up external tunneling or interact with actual payment provider dashboards.

A user interface for generating test webhooks is also available in the admin interface (in development mode only) at the top of the webhook events page. 