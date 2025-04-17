# Email Preview Tool Authentication

## Overview

The Email Preview Tool in the Aesthenda platform now includes authentication to ensure that only authorized users can access template previews. This document explains the authentication implementation and how to use it.

## Features

- **JWT-based Authentication**: Secure token-based authentication system
- **Role-Based Access Control**: System admins can view any tenant's templates, while salon admins can only view their own
- **Tenant Isolation**: Protection ensures users can only access templates for their designated tenant
- **Seamless Integration**: Works with the existing authentication system

## Default Users

For demonstration purposes, the following users are pre-configured:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@aesthenda.com | Admin123! | system_admin | All tenants |
| salon@example.com | Salon123! | salon_admin | tenant123 only |

## Authentication Flow

1. **Login Page**: Users must login at `/preview-login.html` before accessing the preview tool
2. **Token Storage**: JWT token is stored in the browser's localStorage
3. **API Authorization**: All API requests include the token in the Authorization header
4. **Tenant Validation**: Server validates tenant access permissions for each request

## Technical Implementation

### Frontend Components

- **Login Page**: `preview-login.html` provides the login interface
- **Token Handling**: The email-preview.html page has been updated with authentication logic
- **Automatic Redirects**: Unauthorized users are automatically redirected to the login page

### Backend Components

- **Authentication Middleware**: Located in `middleware/authMiddleware.js`
- **Login Endpoint**: `/api/auth/login` validates credentials and issues tokens
- **Verification Endpoint**: `/api/preview/verify-token` validates tokens
- **User Info Endpoint**: `/api/preview/user-info` provides user details
- **Protected Routes**: All preview API endpoints are now protected

## Security Considerations

- JWT tokens expire after 24 hours
- System admins have access to all tenants, salon admins only to their assigned tenant
- In production, passwords should be stored securely (hashed and salted)
- Consider implementing HTTPS for all communications

## Adding New Users

In a production environment, you would integrate with the user service. For the current implementation, to add new users:

1. Edit the `validUsers` array in the `/api/auth/login` endpoint in `services/notification-service/index.js`
2. Add a new user object with email, password, id, role, and tenantId
3. Restart the notification service

```javascript
const validUsers = [
  {
    email: 'newuser@example.com',
    password: 'SecurePassword!',
    id: '3',
    role: 'salon_admin',
    tenantId: 'tenant456'
  },
  // ... existing users
];
```

## Testing the Authentication

1. Access the email preview tool at `http://localhost:5003/email-preview.html`
2. You will be redirected to the login page
3. Enter valid credentials (see Default Users section)
4. After successful login, you will be redirected to the preview tool
5. You should see your email address displayed in the top right corner

## Troubleshooting

- If you cannot log in, verify you are using the correct credentials
- If you're redirected to login while browsing, your token may have expired
- Check browser console for any API errors
- Ensure the notification service is running 