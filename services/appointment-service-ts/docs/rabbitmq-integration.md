# RabbitMQ Integration Documentation

## Overview

This document describes the event-driven architecture using RabbitMQ for the Aesthenda microservices platform. It serves as a reference for developers working on existing or new services that need to publish or consume appointment-related events.

## RabbitMQ Setup

The appointment service uses the following RabbitMQ configuration:

- **Exchange**: `appointment_events` (topic exchange)
- **Queues**: 
  - `appointment_notifications` - Bound to `appointment.#` routing pattern

## Event Schema

All appointment events follow this standardized schema:

```typescript
interface AppointmentEvent {
  type: AppointmentEventType;  // Enum value indicating event type
  appointmentId: string;       // MongoDB ID of the appointment
  tenantId: string;            // Tenant ID for multi-tenancy support
  userId: string;              // Client/user ID
  stylistId: string;           // Service provider ID
  date: string;                // ISO formatted date
  status: AppointmentStatus;   // Current appointment status
  timestamp: string;           // ISO formatted event timestamp
}

enum AppointmentEventType {
  CREATED = "APPOINTMENT_CREATED",
  UPDATED = "APPOINTMENT_UPDATED",
  CANCELLED = "APPOINTMENT_CANCELLED",
  CONFIRMED = "APPOINTMENT_CONFIRMED",
  COMPLETED = "APPOINTMENT_COMPLETED",
  NO_SHOW = "APPOINTMENT_NO_SHOW"
}
```

## Available Events

The appointment service publishes the following events:

| Event Type | Routing Key | Trigger | Payload |
|------------|-------------|---------|---------|
| `CREATED` | `appointment.created` | New appointment booked | Standard schema |
| `UPDATED` | `appointment.updated` | Appointment details changed | Standard schema |
| `CANCELLED` | `appointment.cancelled` | Appointment cancelled | Standard schema + cancellationReason |
| `CONFIRMED` | `appointment.confirmed` | Appointment confirmed | Standard schema |
| `COMPLETED` | `appointment.completed` | Service completed | Standard schema |
| `NO_SHOW` | `appointment.no_show` | Client didn't show up | Standard schema |

## Tenant Isolation

To maintain tenant isolation:

1. All event messages include the `tenantId` in the payload
2. The `tenantId` is also included in message headers as `x-tenant-id`
3. Consumer services should filter/process messages based on tenant context

## Integration Patterns

### For Services Consuming Appointment Events

1. **Connect to RabbitMQ**:
   ```typescript
   // Example connection setup
   import amqp from 'amqplib';
   
   async function connectToRabbitMQ() {
     const connection = await amqp.connect(process.env.RABBITMQ_URL);
     const channel = await connection.createChannel();
     return { connection, channel };
   }
   ```

2. **Set Up Consumer**:
   ```typescript
   async function setupConsumer(channel) {
     // Ensure queue exists
     await channel.assertQueue('appointment_notifications');
     
     // Consume messages
     channel.consume('appointment_notifications', async (msg) => {
       if (!msg) return;
       
       try {
         // Parse message
         const content = JSON.parse(msg.content.toString());
         const tenantId = msg.properties.headers['x-tenant-id'];
         
         // Process based on event type
         switch (content.type) {
           case 'APPOINTMENT_CREATED':
             await handleAppointmentCreated(content, tenantId);
             break;
           case 'APPOINTMENT_CANCELLED':
             await handleAppointmentCancelled(content, tenantId);
             break;
           // Handle other event types
         }
         
         // Acknowledge message
         channel.ack(msg);
       } catch (error) {
         console.error('Error processing message:', error);
         // Negative acknowledgment - requeue if it's a processing error
         channel.nack(msg, false, true);
       }
     });
   }
   ```

### For New Services Publishing Events

1. Use the shared `rabbitmq.ts` utility module
2. Follow the pattern established in the appointment service
3. Include tenant ID in both message payload and headers
4. Use descriptive routing keys in the format `{service}.{event}`

```typescript
// Example publishing event
import { publishToExchange } from '../utils/rabbitmq';

await publishToExchange(
  'service_events',          // Exchange name
  'service.event_type',      // Routing key
  {
    type: 'EVENT_TYPE',      // Event type enum
    tenantId,                // Always include tenant ID
    // Other event data
    timestamp: new Date().toISOString(),
  },
  { tenantId }               // Include in headers
);
```

## Best Practices

1. **Message Persistence**: All messages are published with `persistent: true` to survive RabbitMQ restarts
2. **Error Handling**: Implement proper error handling and retries in consumers
3. **Graceful Shutdown**: Close connections properly when services shut down
4. **Message Acknowledgment**: Always acknowledge messages after successful processing
5. **Idempotency**: Design consumers to handle duplicate messages safely

## Testing

For testing RabbitMQ integration, use the provided test script:

```
npx ts-node src/utils/test-rabbitmq.ts
```

## Monitoring

RabbitMQ management console: http://localhost:15672/
Default credentials: guest/guest 