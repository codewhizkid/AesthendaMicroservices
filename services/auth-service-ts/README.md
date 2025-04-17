# Aesthenda Service Template

This is a template for creating new microservices in the Aesthenda platform. It follows the standardized architecture pattern with tenant isolation, TypeScript, and GraphQL.

## Directory Structure

```
src/
  ├── config/                # Configuration management
  ├── db/                    # Database connection management
  ├── middleware/            # Express and GraphQL middleware
  ├── models/                # Data models with tenant isolation
  ├── resolvers/             # GraphQL resolvers
  ├── utils/                 # Utility functions
  ├── types/                 # TypeScript type definitions
  ├── plugins/               # Apollo Server plugins
  ├── tests/                 # Test files
  ├── migrations/            # Database migration scripts
  ├── index.ts               # Main application entry point
  └── schema.ts              # GraphQL schema definition
```

## Key Features

- **Tenant Isolation**: All data is isolated by tenant
- **Type Safety**: Full TypeScript implementation
- **Authentication**: JWT-based authentication with role checking
- **Error Handling**: Standardized error formatting
- **Database Connection**: Singleton pattern for MongoDB connection
- **Testing**: Jest configuration for unit and integration tests

## How to Use This Template

1. Copy this directory to create a new service
2. Update the `package.json` with your service name and description
3. Implement your GraphQL schema in `schema.ts`
4. Create your models in the `models/` directory
5. Implement your resolvers in the `resolvers/` directory
6. Copy the `.env.example` to `.env` and update the values

## Running the Service

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build for production
npm run build

# Run in production mode
npm start

# Run tests
npm test
```

## Database Migrations

```bash
# Run migrations
npm run migrate

# Rollback migrations
npm run migrate:down
```

## Best Practices

1. Always use tenant isolation for all database operations
2. Apply role-based access control to all resolvers
3. All environment variables should be loaded via the config module
4. Add comprehensive tests for all functionality
5. Document your code with JSDoc comments 