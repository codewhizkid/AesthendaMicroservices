# Aesthenda API Gateway

The API Gateway is the central entry point for all client applications to interact with the Aesthenda microservices platform. It handles authentication, request routing, tenant isolation, and provides a unified GraphQL API for clients.

## Key Features

- **Unified GraphQL API**: Provides a single entry point for all client applications
- **Authentication**: JWT-based authentication with refresh tokens
- **Multi-tenancy**: Ensures proper tenant isolation across all service requests
- **Error Handling**: Standardized error responses across all services
- **OAuth Integration**: Support for Google and Facebook authentication
- **Rate Limiting**: Protects services from excessive requests
- **Monitoring**: Basic health check endpoints for monitoring

## Architecture

The API Gateway is built with:

- Node.js and Express
- Apollo Server for GraphQL
- Redis for rate limiting and caching
- Passport.js for OAuth authentication

## Configuration

The API Gateway uses environment variables for configuration. Copy the `.env.example` file to `.env` and adjust the values according to your environment.

```bash
cp .env.example .env
```

### Important Configuration Options

#### Service URLs

Service URLs can be configured for both local development and Docker Compose:

```
# For local development with direct host ports:
AUTH_SERVICE_URL=http://localhost:5001

# For Docker Compose network:
AUTH_SERVICE_URL=http://auth-service-ts:5001
```

#### Tenant Configuration

```
# Default tenant ID (for development)
DEFAULT_TENANT_ID=default_tenant

# Custom header name for tenant identification
TENANT_HEADER_NAME=x-tenant-id
```

#### Security and JWT

```
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

## Multi-tenancy Implementation

The API Gateway ensures proper tenant isolation through several mechanisms:

1. **Tenant Extraction**:
   - From HTTP headers (`x-tenant-id`)
   - From JWT tokens
   - From GraphQL variables
   - From query parameters (for REST endpoints)

2. **Tenant Propagation**:
   - Tenant ID is included in all downstream service requests
   - Headers are used for tenant context propagation

3. **Validation**:
   - Operations that require tenant context will validate tenant ID presence
   - Appropriate error responses are returned when tenant context is missing

## Error Handling

The API Gateway implements standardized error handling:

1. **Error Types**:
   - Authentication errors
   - Authorization errors
   - Validation errors
   - Not found errors
   - Service unavailable errors
   - Tenant-related errors

2. **Error Response Format**:
   ```json
   {
     "errors": [
       {
         "message": "Error message",
         "path": ["field", "path"],
         "extensions": {
           "code": "ERROR_CODE"
         }
       }
     ]
   }
   ```

3. **Service Communication**:
   - Timeouts are properly handled
   - Service unavailability is reported with clear messages
   - GraphQL errors from services are properly formatted

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Start in production mode
npm start
```

## API Documentation

The GraphQL Playground is available at `/graphql` in development mode, providing interactive documentation for the API.

## Monitoring and Health Checks

- `GET /health`: Basic health check endpoint
- `GET /graphql`: GraphQL Playground (in development mode)
- `GET /metrics`: Basic metrics (if Prometheus integration is enabled)

## Security Recommendations

1. Use a strong, unique JWT secret in production
2. Enable rate limiting in production
3. Configure proper CORS settings for your frontend domains
4. Regularly update dependencies for security patches
5. Set appropriate timeouts for service communications 