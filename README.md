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
- Social login with Google and Facebook OAuth 2.0
- Rate limiting and brute-force protection with Redis
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
   - Login with Google or Facebook
   - Get your user profile (requires authentication)
   - Refresh an expired token
   - Logout (single device)
   - Logout from all devices

### Environment Configuration

For OAuth and rate limiting to work properly, you need to set up the following environment variables:

```
# API Gateway OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FRONTEND_URL=http://localhost:8080
SESSION_SECRET=your_session_secret

# Redis Configuration
REDIS_URL=redis://redis:6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key
```

### Setting Up OAuth Providers

#### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add `http://localhost:4000/auth/google/callback` as an authorized redirect URI
7. Copy the generated Client ID and Client Secret to your environment variables

#### Facebook OAuth Setup

1. Go to the [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add the "Facebook Login" product to your app
4. In Facebook Login settings, add `http://localhost:4000/auth/facebook/callback` as a valid OAuth redirect URI
5. Copy the App ID and App Secret to your environment variables

### Authentication Endpoints

| Endpoint | Description |
|----------|-------------|
| `register` | Register a new user with name, email, password and role |
| `login` | Login with email and password |
| `oauthLogin` | Authenticate with Google or Facebook |
| `/auth/google` | Initiate Google OAuth flow |
| `/auth/facebook` | Initiate Facebook OAuth flow |
| `refreshToken` | Get a new access token using a refresh token |
| `logout` | Logout (invalidate a specific refresh token) |
| `logoutAll` | Logout from all devices (invalidate all refresh tokens) |
| `me` | Get current authenticated user profile |
| `updateProfile` | Update user profile (authenticated users only) |
| `updateUserRole` | Update user role (admin only) |
| `deleteUser` | Delete a user (self or admin only) |

### OAuth Integration

The OAuth integration works as follows:

1. **User Initiates OAuth Flow**: User clicks on "Login with Google" or "Login with Facebook" button.

2. **Redirect to Provider**: User is redirected to the provider's authentication page:
   - `http://localhost:4000/auth/google` for Google
   - `http://localhost:4000/auth/facebook` for Facebook

3. **Authorization by Provider**: User authorizes the application on the provider's site.

4. **Callback Processing**: Provider redirects back to our callback URL with authorization code.
   - The API Gateway receives the callback
   - It exchanges the code for an access token
   - It uses the token to fetch the user's profile from the provider

5. **User Creation/Login**:
   - If the user exists with the same OAuth ID, they are logged in
   - If a user exists with the same email, the OAuth provider is linked to their account
   - If no matching user exists, a new user account is created

6. **Token Generation**:
   - JWT access token and refresh token are generated
   - User is redirected back to the frontend with these tokens

7. **Session Management**:
   - The frontend stores the tokens in localStorage
   - The same token refresh mechanism applies as with regular login

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

### Security Features

#### Rate Limiting & Brute-Force Protection

The API Gateway implements multiple layers of rate limiting to protect against brute-force attacks and abuse:

1. **Global Rate Limiting**:
   - Limits all IP addresses to 500 requests per 15-minute window
   - Applies to all endpoints and routes

2. **Authentication-Specific Rate Limiting**:
   - Stricter limits for authentication operations (login, register)
   - Restricts IPs to 10 authentication attempts per hour
   - Helps prevent credential stuffing and brute-force attacks

3. **Redis-Backed Storage**:
   - Rate limit counters persist across server restarts
   - Distributed rate limiting works across multiple API Gateway instances
   - Provides more reliable protection than in-memory stores

4. **Security Headers**:
   - Implemented using Helmet middleware
   - Protects against common web vulnerabilities
   - Sets appropriate security headers for all responses

When rate limits are exceeded, the server responds with a 429 Too Many Requests status code and a message indicating when the client can retry.

#### Example of Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1628611200000
```

#### Configuring Rate Limits

Rate limits can be adjusted in the API Gateway's `index.js` file:

```javascript
// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (adjust as needed)
  max: 500, // Max requests per window (adjust as needed)
  // other options...
});

// Authentication rate limiting
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour (adjust as needed)
  max: 10, // Max authentication attempts (adjust as needed)
  // other options...
});
```

# AesthendaMicroservices
