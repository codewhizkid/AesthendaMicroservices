# Admin Dashboard Access

## Admin User Credentials

A system admin user has been created with the following credentials:

- **Email**: admin@aesthenda.com
- **Password**: Admin123!
- **Role**: system_admin
- **Tenant ID**: system

## How to Access the Admin Dashboard

1. Ensure all services are running (`docker-compose up -d`)
2. Access the login page at: http://localhost:8080/login
3. Enter the admin credentials (email and password)
4. After successful login, you'll be redirected to the dashboard
5. Alternatively, you can directly access the admin dashboard at: http://localhost:8080/admin

## Admin Dashboard Features

As a system admin, you have access to:

- **Tenant Management**: View and manage all salon tenants in the system
- **User Management**: Create, update, and manage users and their roles
- **Appointment Overview**: View appointments across all tenants
- **System Configuration**: Manage system-wide settings
- **Analytics**: Access system-wide reporting and metrics

## Recreating the Admin User

If you need to recreate the admin user or change credentials, you can use the provided script:

```bash
# Navigate to the user service directory
cd services/user-service

# Create/update the admin user with default credentials
node scripts/create-admin.js

# Create admin with custom credentials
ADMIN_EMAIL=custom@example.com ADMIN_PASSWORD=CustomPass123! node scripts/create-admin.js
```

## Security Considerations

- The default admin credentials should be changed in a production environment
- Access to the admin dashboard should be restricted to authorized personnel
- Additional authentication measures (like 2FA) are recommended for admin accounts in production 