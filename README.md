# Aesthenda Microservices Setup

## Overview
Aesthenda is a scalable, microservices-based salon booking system.

## 📂 Microservices Breakdown
- **User Service (GraphQL)**: Handles authentication and user profiles.
- **Appointment Service (GraphQL)**: Manages booking & scheduling.
- **Notification Service (RabbitMQ)**: Handles email/SMS notifications.
- **Payment Service (Future Integration)**: Manages transactions.
- **API Gateway**: Routes API calls to appropriate services.

## 🚀 Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone YOUR_REPO_URL
cd AesthendaMicroservices
```

### 2️⃣ Start Services with Docker
```bash
docker-compose up --build
```

### 3️⃣ Access Services
- API Gateway: [http://localhost:4000](http://localhost:4000)
- User Service: [http://localhost:5001](http://localhost:5001)
- Appointment Service: [http://localhost:5002](http://localhost:5002)
- RabbitMQ Dashboard: [http://localhost:15672](http://localhost:15672) (User: guest, Pass: guest)

---

## 🔧 Next Steps
- Implement user authentication with OAuth 2.0 & JWT.
- Add real-time booking availability checks.
- Expand RabbitMQ messaging to support appointment confirmations.

## 🔐 Authentication System

Aesthenda Microservices includes a complete JWT authentication system with role-based access control.

### Features

- User registration with role selection (client, stylist, admin)
- Secure login with JWT tokens
- Role-based authorization
- Password hashing with bcrypt
- Protected routes based on user roles
- Refresh token system for prolonged sessions

### Testing the Authentication System

1. Start all services using Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Start the frontend client:
   ```bash
   cd frontend
   npm start
   ```

3. Open the authentication test page:
   ```
   http://localhost:8080/auth
   ```

4. Test the following flows:
   - Register a new user (try different roles)
   - Login with your credentials
   - Get your user profile (requires authentication)
   - Refresh an expired token
   - Logout (single device)
   - Logout from all devices

### Authentication Endpoints

| Endpoint | Description |
|----------|-------------|
| `register` | Register a new user with name, email, password and role |
| `login` | Login with email and password |
| `refreshToken` | Get a new access token using a refresh token |
| `logout` | Logout (invalidate a specific refresh token) |
| `logoutAll` | Logout from all devices (invalidate all refresh tokens) |
| `me` | Get current authenticated user profile |
| `updateProfile` | Update user profile (authenticated users only) |
| `updateUserRole` | Update user role (admin only) |
| `deleteUser` | Delete a user (self or admin only) |

### JWT Token Structure

The JWT token contains the following claims:
- `id`: User ID
- `email`: User email
- `role`: User role (client, stylist, admin)
- `exp`: Token expiration (15 minutes from creation)

### Refresh Token System

The refresh token system works as follows:

1. **User Authentication**: When a user logs in or registers, they receive both an access token (JWT) and a refresh token.

2. **Token Usage**:
   - The access token is short-lived (15 minutes) and used for API requests
   - The refresh token is long-lived (7 days) and stored securely

3. **Token Renewal Flow**:
   - When an access token expires, the client can use the refresh token to get a new access token
   - This allows users to stay logged in without re-entering credentials
   - The original refresh token remains valid until explicitly logged out or expired

4. **Security Features**:
   - Refresh tokens are stored in the database with expiry dates
   - Tokens can be revoked individually or all at once (logout)
   - Expired tokens are automatically cleaned up

5. **Implementation Pattern**:
   ```javascript
   // Client-side pseudocode
   async function makeAuthenticatedRequest(url, refreshTokenIfNeeded = true) {
     try {
       // Try with current access token
       const response = await fetch(url, {
         headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
       });
       
       if (response.ok) return response.json();
     } catch (error) {
       // If unauthorized and we have a refresh token
       if (error.status === 401 && refreshTokenIfNeeded) {
         const refreshed = await refreshAccessToken();
         if (refreshed) {
           // Retry with new token (but don't try refreshing again)
           return makeAuthenticatedRequest(url, false);
         }
       }
       throw error;
     }
   }
   
   async function refreshAccessToken() {
     const refreshToken = localStorage.getItem('refreshToken');
     if (!refreshToken) return false;
     
     try {
       const response = await fetch('/graphql', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           query: `
             mutation {
               refreshToken(refreshToken: "${refreshToken}") {
                 token
                 success
               }
             }
           `
         })
       });
       
       const data = await response.json();
       if (data.data?.refreshToken?.success) {
         localStorage.setItem('token', data.data.refreshToken.token);
         return true;
       }
       return false;
     } catch (error) {
       // If refresh fails, redirect to login
       localStorage.removeItem('token');
       localStorage.removeItem('refreshToken');
       window.location.href = '/login';
       return false;
     }
   }
   ```

### Role-Based Authorization

- **Client**: Can view and manage their own profile and appointments
- **Stylist**: Can view and manage appointments assigned to them
- **Admin**: Full access to all resources

# AesthendaMicroservices
