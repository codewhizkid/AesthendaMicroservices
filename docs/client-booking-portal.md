# Client Booking Portal Documentation

## Overview

The Aesthenda client booking portal provides a user-friendly, multi-step booking process that allows salon customers to easily schedule appointments. The system is designed with a tenant-specific approach, giving each salon its own branded booking URL and customized experience.

## Features

### Multi-Tenant Support
- Each salon (tenant) has its own dedicated booking portal accessible via `/:tenantId` URL
- Custom branding including salon logo, colors, and business information
- Salon-specific services, staff, and availability

### Intuitive Booking Flow
The booking process follows a logical, step-by-step wizard format:
1. **Service Selection** - Browse and select desired services
2. **Date & Time Selection** - Choose from available appointment slots
3. **Stylist Selection** - Select a preferred stylist based on availability
4. **Customer Information** - Provide contact and booking details
5. **Payment** - Process payment for services (coming soon)
6. **Confirmation** - Review and confirm appointment details

### Real-Time Availability
- Available time slots are calculated based on:
  - Selected services and their duration
  - Staff availability and schedules
  - Existing appointments
  - Business hours
- Time slots update dynamically when service selections change

### Mobile-Friendly Design
- Responsive design that works seamlessly on desktop, tablet, and mobile devices
- Touch-friendly interface elements
- Optimized loading times for mobile connections

### Event-Driven Architecture
- Appointment creation triggers events via RabbitMQ
- Events update relevant systems (notifications, staff calendars, admin dashboards)
- Tenant ID is maintained throughout the event flow for proper data isolation

## Technical Implementation

### Components Structure

#### Pages
- **BookingPortal.jsx** - Landing page for salon-specific booking
- **BookingPage.jsx** - Container component that manages booking state and wizard flow

#### Step Components
- **ServiceSelectionStep** - Service browsing and selection
- **DateTimeSelectionStep** - Calendar and time slot selection
- **StylistSelectionStep** - Staff selection with filtering by availability
- **CustomerInfoStep** - Contact information collection with validation
- **BookingPaymentStep** - Payment processing integration (in progress)
- **BookingConfirmation** - Final confirmation and summary

### Data Flow

1. Client visits salon-specific URL (`/:tenantId`)
2. System loads tenant data including branding and services
3. Client selects services they want to book
4. Based on service selection, available dates and times are calculated
5. Client selects date and time slot
6. Available stylists are determined based on service, date and time
7. Client selects a stylist
8. Client provides contact information
9. (Future) Client makes payment for services
10. Appointment is created in the system
11. Confirmation is displayed to the client
12. Confirmation email is sent to both client and salon

### State Management

The booking system uses React's `useState` hook for state management. The main state object in `BookingPage.jsx` tracks:

```jsx
const [bookingData, setBookingData] = useState({
  services: [],         // Selected services
  date: null,           // Selected date
  time: '',             // Selected time slot
  stylistId: '',        // Selected stylist ID
  stylistName: '',      // Selected stylist name
  customer: {           // Customer information
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  },
  notes: '',            // Additional notes/requests
  totalPrice: 0,         // Total price calculation
  payment: null        // Payment information (future)
});
```

### API Integration

The booking portal interacts with the backend through GraphQL queries:

- `GET_TENANT` - Fetches tenant information including branding
- `GET_SERVICES` - Retrieves available services for a tenant
- `GET_AVAILABLE_SLOTS` - Gets available time slots for a specific date and service selection
- `GET_AVAILABLE_STYLISTS` - Fetches stylists available for selected date, time, and services
- `CREATE_APPOINTMENT` - Creates a new appointment

### Payment Integration 

#### Payment Service Architecture
The payment system is designed with a multi-tenant, multi-provider approach, allowing each salon to configure their preferred payment provider:

- **Tenant-Specific Configuration**: Each salon can configure their own payment provider (Stripe, Square, PayPal)
- **Provider Abstraction**: A standardized interface allows consistent payment operations across different providers
- **Event-Driven Updates**: Payment events (created, completed, failed, refunded) are published via RabbitMQ to update appointment status

#### Payment Processing Flow
1. Tenant payment configuration is fetched when customer reaches payment step
2. Client-side payment form is dynamically rendered based on the active provider
3. Payment intent is created on the server to prepare for payment processing
4. Customer payment information is collected and processed through the provider's SDK
5. Payment confirmation is published as an event for downstream systems
6. Appointment status is updated based on payment result

#### RabbitMQ Event Integration
The payment service publishes events via RabbitMQ when payment status changes:
- `PAYMENT_CREATED` - When a payment intent is created
- `PAYMENT_COMPLETED` - When payment is successfully processed
- `PAYMENT_FAILED` - When payment processing fails
- `PAYMENT_REFUNDED` - When a payment is refunded

These events include the tenant ID to maintain proper multi-tenant isolation and are consumed by other services like appointment and notification services.

### Routing

The booking portal uses React Router for navigation:

- `/:tenantId` - Salon landing page
- `/:tenantId/booking/services` - Service selection step
- `/:tenantId/booking/datetime` - Date and time selection
- `/:tenantId/booking/stylist` - Stylist selection
- `/:tenantId/booking/customer_info` - Customer information
- `/:tenantId/booking/payment` - Payment processing (coming soon)
- `/:tenantId/booking/confirmation` - Booking confirmation

## UI/UX Considerations

### Tenant Branding
The system applies tenant-specific branding throughout the booking flow:

```jsx
// Example of applying tenant branding
const tenant = tenantData.tenant;
const primaryColor = tenant.settings?.branding?.primaryColor || '#0ea5e9';

// In component render
<header style={{ backgroundColor: `${primaryColor}10` }}>
  {/* Header content with tenant branding */}
</header>
```

### Progress Indication
- Visual step indicator shows current progress in the booking flow
- "Back" and "Continue" buttons for intuitive navigation
- Clear validation messages when required information is missing

### Accessibility
- Semantic HTML structure for screen reader compatibility
- Keyboard navigation support
- Sufficient color contrast for readability
- Focus management between steps

## Setup and Configuration

### Adding New Tenant Booking Portal

1. Ensure the tenant exists in the system with proper configuration
2. Verify services, staff, and schedules are set up for the tenant
3. Configure tenant branding in the admin dashboard
4. The booking portal will be automatically available at `/:tenantId`

### Payment Configuration

1. Set up payment provider in admin dashboard:
   - Choose provider (Stripe, Square, PayPal)
   - Enter API credentials
   - Configure payment settings (currency, fees, taxes)
2. Test connection to ensure provider is properly configured
3. Payment step will automatically use the configured provider

### Customizing the Booking Experience

In the Admin Dashboard, tenants can:
- Enable/disable specific services
- Set up staff profiles and specialties
- Configure business hours and availability
- Customize branding elements
- Set up confirmation email templates
- Configure payment options

## Event Integration

Appointments created through the booking portal generate events:

1. `appointment.created` event is published to RabbitMQ
2. The event includes the tenant ID to maintain proper data isolation
3. Other services (notifications, calendars) consume these events
4. Event-driven architecture ensures all systems stay in sync

## Future Enhancements

1. **Payment Integration** - Complete payment processing step before confirmation
2. **Google Calendar Integration** - Allow appointments to sync with customer's calendar
3. **Reminder System** - Send SMS/email reminders before appointments
4. **Recurring Appointments** - Enable booking of recurring appointments
5. **Service Bundles** - Create and offer service packages/bundles 