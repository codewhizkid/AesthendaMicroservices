# Aesthenda Salon Management Platform Demo

This is a demonstration project for the Aesthenda Salon Management Platform, showcasing the multi-tenant architecture with role-based access control (RBAC) and tenant-specific branding.

## Features Demonstrated

- **Multi-tenant authentication** - Users authenticate with tenant isolation
- **Stylist/Employee ID system** - Each staff member has a unique ID within their tenant
- **Role-based permissions** - Different UI elements and data access based on user roles
- **Tenant-specific branding** - Each salon has its own colors, fonts, and settings
- **Tenant data isolation** - Users can only access data from their own salon/tenant

## Login Credentials

Use these demo credentials to test different roles and tenants:

- **Salon Admin (Serenity Spa)**
  - Email: admin@salon1.com
  - Password: password
  
- **Stylist (Serenity Spa)**
  - Email: stylist@salon1.com
  - Password: password
  
- **Different Salon (Luxe Hair)**
  - Email: admin@salon2.com
  - Password: password

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/aesthenda-demo.git
cd aesthenda-demo
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser to `http://localhost:5173`

## Project Structure

```
/src
  /api - Mock data and API functions
  /components - Reusable UI components
    /dashboard - Dashboard-specific components
  /context - React context providers
  /hooks - Custom React hooks
  /pages - Main application pages
  App.jsx - Main application component with routing
  main.jsx - Entry point
```

## Technologies Used

- React 18
- React Router v6
- Tailwind CSS
- Context API for state management

## Documentation

For detailed documentation, check the following:

- [Code Patterns](/docs/PATTERNS.md) - Standard patterns for component development
- [Advanced Patterns](/docs/ADVANCED_PATTERNS.md) - More complex patterns and examples
- [Frontend Routes](/docs/navigation/ROUTES.md) - Documentation of all available routes and navigation

## Multi-Tenant Implementation Details

The application demonstrates several key aspects of a multi-tenant system:

1. **Authentication with Tenant Context**
   - Users log in with credentials linked to a specific tenant
   - JWT tokens include both user ID and tenant ID

2. **Data Isolation by Tenant**
   - All queries and data access is filtered by tenant ID
   - Staff can only see data from their own salon

3. **Role-Based Access Control**
   - Salon admins can see all staff and appointments
   - Stylists can only see their own appointments
   - UI navigation adapts based on user role

4. **Tenant-Specific Branding**
   - Each salon has its own color scheme and fonts
   - Dynamic application of branding through CSS variables

5. **Stylist ID System**
   - Each staff member has a unique ID within their tenant
   - Appointments are linked to specific stylists
   - Staff permissions are based on role + ID

## License

This project is licensed under the MIT License - see the LICENSE file for details.