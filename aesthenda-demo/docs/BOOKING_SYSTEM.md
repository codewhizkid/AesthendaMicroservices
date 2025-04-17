# Client Booking System

This document provides detailed information about the client-facing booking system implemented in the Aesthenda platform.

## Overview

The booking system allows clients to book appointments with stylists at salons/tenants without requiring an account. The system follows a multi-step wizard pattern that guides customers through the appointment booking process.

## Architecture

The booking system consists of the following components:

### Pages
- **BookingPortal.jsx** - The landing page for salon-specific booking portal
- **BookingPage.jsx** - Container component that manages the booking state and renders the appropriate step

### Step Components
- **ServiceSelectionStep** - Allows clients to select services they want to book
- **DateTimeSelectionStep** - Enables date and time selection based on availability
- **StylistSelectionStep** - Presents available stylists for the selected date, time, and services
- **CustomerInfoStep** - Collects customer contact information
- **BookingConfirmation** - Displays booking confirmation and details

## Features

### Multi-Tenant Support
- Each salon (tenant) has its own booking portal with custom branding
- The branding includes custom colors, logo, and business information
- Accessed via `/:tenantId` URL format

### Real-Time Availability
- Available time slots are fetched based on:
  - Selected services and duration
  - Staff availability
  - Business hours
  - Existing appointments

### Dynamic Service Selection
- Services are categorized and displayed with pricing and duration
- Multiple services can be selected with automatic price calculation

### Stylist Selection
- Shows only stylists available for the selected services, date, and time
- Displays stylist specialties, ratings, and brief bio
- Visual feedback when selecting a stylist

### Form Validation
- Client information forms include comprehensive validation
- Validates email format, phone number format, and required fields
- Real-time error messages and field highlighting

### Progress Tracking
- Visual progress indicator shows the current step in the booking process
- Allows navigation between steps with proper state management

## Technical Implementation

### State Management
The booking system uses React's `useState` and prop drilling for state management. The main booking data state is maintained in the `BookingPage` component and includes:

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
  totalPrice: 0         // Total price calculation
});
```

### Data Flow
1. User selects services → updates `services` array in state
2. User selects date/time → updates `date` and `time` in state
3. User selects stylist → updates `stylistId` and `stylistName` in state
4. User provides contact info → updates `customer` object and `notes` in state
5. Booking is finalized → displays confirmation

### API Integration
The booking system integrates with the following GraphQL queries:

- `GET_TENANT` - Fetches tenant information including branding
- `GET_SERVICES` - Retrieves available services for a tenant
- `GET_AVAILABLE_SLOTS` - Gets available time slots for a specific date
- `GET_AVAILABLE_STYLISTS` - Fetches stylists available for selected date, time, and services

### Navigation
Navigation between steps is handled through React Router's `useNavigate` hook, with URL patterns following:

```
/:tenantId/booking/:step
```

Where `:step` can be one of: `services`, `datetime`, `stylist`, `customer_info`, or `confirmation`.

## Usage

### Adding to App.jsx
The booking routes are registered in the main App.jsx file:

```jsx
<Routes>
  {/* Public routes */}
  <Route path="/" element={<Welcome />} />
  
  {/* Client Booking Portal Routes */}
  <Route path="/:tenantId" element={<BookingPortal />} />
  <Route path="/:tenantId/booking/:step" element={<BookingPage />} />
  
  {/* Protected routes */}
  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
  {/* other routes... */}
</Routes>
```

### Tenant-Specific Branding
The booking portal applies tenant-specific branding using this pattern:

```jsx
const tenant = tenantData.tenant;
const primaryColor = tenant.settings?.branding?.primaryColor || '#0ea5e9';

// In JSX
<header style={{ backgroundColor: `${primaryColor}10` }}>
  {/* header content */}
</header>
```

## Future Enhancements

1. **Payment Integration** - Add payment processing step before confirmation (future feature)
2. **Google Calendar Integration** - Allow appointments to sync with customer's calendar
3. **Reminder System** - Send SMS/email reminders before appointments
4. **Recurring Appointments** - Enable booking of recurring appointments
5. **Service Bundles** - Create and offer service packages/bundles

## Known Limitations

1. The booking system currently does not handle:
   - Complex appointment requirements (multiple stylists, overlapping services)
   - Service customization options
   - Group bookings 