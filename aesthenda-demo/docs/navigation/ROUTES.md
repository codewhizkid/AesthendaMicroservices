# Frontend Routes Documentation

This document provides an overview of the available routes in the Aesthenda frontend application and how they are integrated with the navigation system.

## Available Routes

The Aesthenda application uses React Router for navigation and implements the following routes:

### Public Routes
- `/` - Welcome page
- `/login` - User login
- `/register` - User registration
- `/registration-success` - Registration success confirmation

### Client Booking Portal Routes
- `/:tenantId` - Booking portal landing page for a specific salon/tenant
- `/:tenantId/booking/services` - Service selection step
- `/:tenantId/booking/datetime` - Date and time selection step
- `/:tenantId/booking/stylist` - Stylist selection step
- `/:tenantId/booking/customer_info` - Customer information step
- `/:tenantId/booking/confirmation` - Booking confirmation step

### Registration Flow Routes (Protected)
- `/plan-selection` - Subscription plan selection
- `/payment` - Payment processing
- `/onboarding` - Tenant onboarding

### Dashboard Routes (Protected)
- `/dashboard` - Main dashboard/home
- `/dashboard/appointments` - Appointment management
- `/dashboard/staff` - Staff management (salon_admin only)
- `/dashboard/schedule` - Staff Schedule management (salon_admin, stylist, salon_staff)
- `/dashboard/services` - Service management (salon_admin, salon_staff)
- `/dashboard/clients` - Client management
- `/dashboard/payments` - Payment transactions (salon_admin only)
- `/dashboard/webhook-events` - Webhook events monitoring (salon_admin only)
- `/dashboard/analytics` - Analytics dashboard (salon_admin only)
- `/dashboard/settings` - Salon settings (salon_admin only)

## Navigation Integration

### Sidebar Navigation

The application's sidebar navigation is role-based, meaning different users will see different navigation options based on their assigned role. This is implemented in the `Sidebar.jsx` component, which uses the user's role to determine which navigation items to display.

For example, the Staff Schedule route is available to users with the following roles:
- salon_admin
- stylist
- salon_staff

```jsx
// Example from Sidebar.jsx
if (hasRole(['salon_admin', 'stylist', 'salon_staff'])) {
  items.push({
    name: 'Staff Schedule',
    to: '/dashboard/schedule',
    icon: <ScheduleIcon />,
  });
}
```

### Route Protection

All dashboard routes are protected with the `PrivateRoute` component, which ensures that only authenticated users can access these routes. Additionally, certain routes have role-specific protection in the sidebar navigation.

```jsx
// Example from App.jsx
<Route 
  path="/dashboard/schedule" 
  element={
    <PrivateRoute>
      <StaffSchedule />
    </PrivateRoute>
  } 
/>
```

## Navigation Components

### Main Navigation Components

- `Sidebar.jsx` - Provides the main dashboard navigation based on user roles
- `Header.jsx` - Top navigation bar with user profile and actions
- `PrivateRoute.jsx` - Route wrapper that enforces authentication

### Navigation State

The active route state is managed by React Router's hooks:

```jsx
const location = useLocation();
const isActive = item.exact
  ? location.pathname === item.to
  : location.pathname.startsWith(item.to);
```

This allows for visual indication of the current active route in the navigation. 