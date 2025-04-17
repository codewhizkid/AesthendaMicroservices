# Appointment Service

The Appointment Service manages all appointment-related operations in the Aesthenda platform, including booking, rescheduling, cancellation, and status updates.

## Features

- Create, update, cancel, and manage appointments
- Check stylist availability
- Support for multi-tenancy through tenant isolation
- Real-time event publishing via RabbitMQ

## Tech Stack

- Node.js with TypeScript
- Apollo Server for GraphQL API
- Mongoose/MongoDB for data storage
- RabbitMQ for event-driven architecture
- Express for HTTP server

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- RabbitMQ

### Installation

1. Clone the repository
2. Navigate to the appointment service directory:
   ```
   cd services/appointment-service-ts
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```
5. Update the environment variables as needed

### Development

Start the service in development mode:

```
npm run dev
```

### Production Build

Build the TypeScript code:

```
npm run build
```

Run the production version:

```
npm start
```

## Docker

The service can be run using Docker:

```
docker compose up -d appointment-service-ts
```

## API Reference

The service exposes a GraphQL API with the following main operations:

### Queries

- `appointments`: Get a list of appointments with filtering and pagination
- `appointment`: Get a single appointment by ID
- `userAppointments`: Get all appointments for a specific user
- `stylistAppointments`: Get all appointments for a specific stylist
- `stylistAvailability`: Check availability slots for a stylist on a specific date

### Mutations

- `createAppointment`: Book a new appointment
- `updateAppointment`: Update an existing appointment
- `cancelAppointment`: Cancel an appointment
- `confirmAppointment`: Confirm an appointment
- `completeAppointment`: Mark an appointment as completed
- `markNoShow`: Mark an appointment as no-show

## Event-Driven Architecture

The service publishes events to RabbitMQ when appointments are created, updated, cancelled, etc. These events can be consumed by other services (like the notification service) to react to appointment changes.

For details on the RabbitMQ integration, see [RabbitMQ Integration Documentation](./docs/rabbitmq-integration.md).

## Tenant Isolation

All operations in this service respect tenant isolation. Every request requires a tenant ID, and all data access is filtered by tenant.

## Testing

Run tests:

```
npm test
```

## License

Proprietary - Aesthenda 