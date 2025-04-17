# Payment Service RabbitMQ Integration

This document outlines how the payment service integrates with other services (particularly the appointment service) using RabbitMQ for asynchronous communication.

## Overview

The Aesthenda microservices architecture uses RabbitMQ as a message broker to enable event-driven communication between services. For payment processing, the following flow is implemented:

1. **Payment Service**: Publishes events when payment status changes (created, completed, failed, refunded)
2. **Appointment Service**: Consumes payment events and updates appointment status accordingly
3. **Notification Service**: Can consume both appointment and payment events to send appropriate notifications

This approach ensures loose coupling between services while maintaining data consistency across the system.

## Event Exchange & Queues

### Exchange

- **Name**: `appointment_events` (shared across all services)
- **Type**: Topic exchange
- **Durability**: Durable (survives broker restarts)

### Queues

- **Payment Events Queue**: `payment_events`
  - Bound to exchange with routing pattern: `payment.#`
  - Used by appointment service to consume payment events
  - Includes dead-letter configuration for error handling

- **Appointment Notifications Queue**: `appointment_notifications`
  - Bound to exchange with routing pattern: `appointment.#`
  - Used by notification service to consume appointment events
  - Includes dead-letter configuration for error handling

## Payment Event Types

The payment service publishes the following event types:

1. **PAYMENT_CREATED**: When a payment intent is created
   - Routing key: `payment.created`

2. **PAYMENT_COMPLETED**: When a payment is successfully completed
   - Routing key: `payment.completed`

3. **PAYMENT_FAILED**: When a payment attempt fails
   - Routing key: `payment.failed`

4. **PAYMENT_REFUNDED**: When a payment is refunded
   - Routing key: `payment.refunded`

5. **PAYMENT_CANCELLED**: When a payment is cancelled
   - Routing key: `payment.cancelled`

## Event Message Structure

Payment events follow this structure:

```json
{
  "type": "PAYMENT_COMPLETED",
  "tenantId": "tenant123",
  "paymentId": "pay_123456",
  "appointmentId": "appt_789",
  "customerId": "cust_456",
  "amount": 75.00,
  "currency": "USD",
  "status": "succeeded",
  "timestamp": "2023-06-01T12:34:56.789Z"
}
```

Additional fields for specific events:
- **PAYMENT_FAILED**: Includes `error` field
- **PAYMENT_REFUNDED**: Includes `refundId` and `reason` fields

## Appointment Service Integration

The appointment service updates appointment status based on payment events:

1. **PAYMENT_COMPLETED**:
   - Updates appointment `paymentStatus` to `paid`
   - If appointment status is `pending_confirmation`, changes to `confirmed`
   - Sends `APPOINTMENT_CONFIRMED` event

2. **PAYMENT_FAILED**:
   - Updates appointment `paymentStatus` to `failed`
   - Stores error message in `paymentError` field

3. **PAYMENT_REFUNDED**:
   - Updates appointment `paymentStatus` to `refunded`
   - For full refunds, may change appointment status to `cancelled`
   - Sends `APPOINTMENT_CANCELLED` event if cancelled

## Error Handling

Both services implement robust error handling:

1. **Dead Letter Exchange**: Failed messages are routed to a dead-letter queue
2. **Retry Mechanism**: Messages are retried up to 3 times with exponential backoff
3. **Manual Acknowledgment**: Messages are only acknowledged after successful processing

## Configuration

### Environment Variables

Payment Service:
```
RABBITMQ_URL=amqp://rabbitmq:5672
RABBITMQ_PAYMENT_QUEUE=payment_events
RABBITMQ_EVENTS_EXCHANGE=appointment_events
```

Appointment Service:
```
RABBITMQ_URL=amqp://rabbitmq:5672
RABBITMQ_NOTIFICATION_QUEUE=appointment_notifications
RABBITMQ_PAYMENT_QUEUE=payment_events
RABBITMQ_EVENTS_EXCHANGE=appointment_events
```

## Implementation Details

### Payment Service

The payment service includes:

1. **RabbitMQ Connection**: Manages connection to RabbitMQ
2. **Queue/Exchange Setup**: Creates necessary queues and bindings
3. **Event Publishing**: Publishes events when payment status changes

### Appointment Service

The appointment service includes:

1. **Payment Events Consumer**: Consumes messages from the payment events queue
2. **Event Handlers**: Update appointment status based on payment events
3. **Downstream Event Publishing**: Sends appointment events when status changes

## Testing

To test the RabbitMQ integration:

1. Start all services with Docker Compose
2. Create an appointment with payment required
3. Process a payment through the payment service
4. Verify the appointment status is updated correctly
5. Check the RabbitMQ management console (http://localhost:15672) for message flow

## Monitoring

RabbitMQ provides a management UI at http://localhost:15672 (default credentials: guest/guest) where you can:

1. Monitor queues and message rates
2. View exchange bindings
3. Inspect message contents
4. Check for dead-lettered messages

## Troubleshooting

Common issues and solutions:

1. **Connection Issues**: Ensure RabbitMQ container is running and accessible
2. **Missing Messages**: Check queue bindings and routing patterns
3. **Failed Processing**: Inspect dead-letter queue for failed messages
4. **Message Format**: Verify event structure matches expected format 