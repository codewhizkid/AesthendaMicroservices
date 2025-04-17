# Calendar Service

This service provides calendar, scheduling, and resource management functionality for the Aesthetenda platform.

## Features

- Event creation and management
- Resource booking and scheduling
- Business hours management
- Recurring events using iCal RRule format
- Multi-tenant isolation
- GraphQL API with real-time subscription support

## Type Safety with GraphQL Code Generator

We use GraphQL Code Generator to ensure type safety and consistency between our GraphQL schema and resolver implementations. This helps catch errors at compile time and provides better developer experience.

### Key Benefits

- **Type-Safe Resolvers**: All resolvers are typed to match the GraphQL schema
- **Automatic Type Generation**: Types are automatically generated from the schema
- **IDE Support**: Full autocomplete and type checking in your IDE
- **Schema/Resolver Consistency**: Ensures resolvers match the schema definition

### Usage

To generate types from the schema:

```bash
npm run codegen
```

To use the generated types in your resolver:

```typescript
import { 
  QueryEventsArgs, 
  MutationCreateEventArgs 
} from '../generated/graphql';

// Type-safe resolver
const eventsResolver = (_, args: QueryEventsArgs, context) => {
  // Implementation with full type safety
};
```

For more details, see the [GraphQL Code Generator documentation](docs/graphql-codegen.md).

## Setup

### Prerequisites

- Node.js v18+
- MongoDB
- Redis (for subscriptions)
- RabbitMQ (for event bus)

### Environment Variables

Create a `.env` file with the following variables:

```
PORT=4002
MONGODB_URI=mongodb://localhost:27017/calendar-service
NODE_ENV=development
JWT_SECRET=your-secret-key
RABBITMQ_URL=amqp://localhost:5672
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

## Scripts

- `npm start` - Start the service
- `npm run dev` - Start in development mode with hot reloading
- `npm run build` - Build the service
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run format` - Format code
- `npm run codegen` - Generate types from GraphQL schema
- `npm run migrate` - Run database migrations
- `npm run db:diagnose` - Diagnose database connection issues

## Architecture

### Directory Structure

```
├── src/
│   ├── config/           # Configuration
│   ├── db/               # Database connection and models
│   ├── generated/        # Generated GraphQL types
│   ├── middleware/       # Express and GraphQL middleware
│   ├── migrations/       # Database migrations
│   ├── models/           # Mongoose models
│   ├── plugins/          # Apollo Server plugins
│   ├── resolvers/        # GraphQL resolvers
│   ├── schema/           # GraphQL schema definitions
│   ├── scripts/          # Utility scripts
│   ├── tests/            # Tests
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── index.ts          # Service entry point
│   └── schema.ts         # Combined GraphQL schema
```

### Key Concepts

1. **Multi-Tenant Isolation**: All data is isolated by tenant
2. **Type Safety**: GraphQL schema generates TypeScript types
3. **Connection Management**: Singleton pattern for database connections
4. **Role-Based Access Control**: Authorization by user role

## API Documentation

The GraphQL API is available at `/graphql`. You can explore the API using GraphQL Playground in development mode.

## Contributing

Please follow the established code style and patterns. Run tests before submitting pull requests.

## License

Proprietary - Aesthetenda, Inc.

## Architecture Standards Implementation

### 1. Centralized Configuration

- **Implementation**: All configuration is loaded from the centralized `/src/config/index.ts` module
- **No Hard-coded Values**: All service settings come from environment variables with sensible defaults
- **Consistent Versioning**: All dependencies use fixed versions across services

**Usage Example**:
```typescript
import config from '../config';

// Use configuration values
const port = config.server.port;
const dbUri = config.database.uri;
```

### 2. Singleton Connections

- **Implementation**: Database connections use the singleton pattern in `/src/db/connection.ts`
- **Connection Reuse**: Before creating new connections, the system checks for existing ones
- **Graceful Shutdown**: All connections are properly closed on application shutdown

**Usage Example**:
```typescript
import connectDB from '../db/connection';

// Get a MongoDB connection
await connectDB();
```

### 3. Tenant Isolation & RBAC

- **Implementation**: Middleware for tenant isolation in `/src/middleware/tenantSecurity.ts`
- **All Models**: Every data model includes a `tenantId` field for isolation
- **All Resolvers**: Queries automatically filter by tenant using `withTenantIsolation` and `withRBAC` middleware
- **Role-based Checks**: Consistent role checks across all mutations

**Usage Example**:
```typescript
// Apply tenant isolation middleware
export const safeResolver = withTenantIsolation(baseResolver);

// Apply RBAC middleware
export const adminResolver = withRBAC(baseResolver, ['ADMIN']);
```

### 4. Unified Error Handling

- **Implementation**: Centralized error handling in `/src/middleware/errorHandler.ts`
- **Standardized Formats**: All errors follow the same format for client responses
- **Consistent Logging**: All errors are properly logged with appropriate detail
- **GraphQL Errors**: Custom formatting for GraphQL errors

**Usage Example**:
```typescript
import { errorHandler } from '../middleware/errorHandler';

// Apply as middleware
app.use(errorHandler);

// Throw standardized errors
throw new AppError('Resource not found', 404);
```

### 5. Automated Testing & Migrations

- **Test Setup**: Test utilities properly handle connection reuse in `/src/tests/testUtils.ts`
- **Tenant Isolation**: All tests verify tenant isolation
- **Migration Scripts**: Available in the `/migrations` directory with up/down scripts

### 6. Documentation & Code Reviews

- **Documentation**: This README and inline code documentation
- **Standards Checklist**: Use the checklist below for code reviews

## Development

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Docker (optional)

### Environment Variables

Create a `.env` file with the following variables:

```
PORT=5005
MONGODB_URI=mongodb://localhost:27017/calendar
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### Install Dependencies

```bash
npm install
```

### Start the Service

```bash
npm run dev
```

## API Documentation

The service exposes a GraphQL API with the following main operations:

### Queries
- `events`: Get a list of events with pagination and filtering
- `event`: Get a single event by ID
- `resources`: Get a list of resources with pagination and filtering
- `resource`: Get a single resource by ID

### Mutations
- `createEvent`: Create a new event
- `updateEvent`: Update an existing event
- `deleteEvent`: Delete an event
- `batchUpdateEventStatus`: Update the status of multiple events
- `createResource`: Create a new resource
- `updateResource`: Update an existing resource
- `deleteResource`: Delete a resource

### Subscriptions
- `eventUpdated`: Subscribe to event updates for a specific tenant
- `resourceUpdated`: Subscribe to resource updates for a specific tenant

## Code Review Checklist

- [ ] Configuration loaded from centralized module
- [ ] No hard-coded values or direct environment variable access
- [ ] Database connections use the singleton pattern
- [ ] All data models include a tenantId field
- [ ] All resolvers enforce tenant isolation
- [ ] RBAC is implemented consistently
- [ ] Errors are handled using the central error handler
- [ ] Tests validate tenant isolation
- [ ] Migration scripts are provided for schema changes
- [ ] Documentation is comprehensive 