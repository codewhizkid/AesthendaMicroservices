# Aesthetenda Calendar System

A unified calendar system for managing appointments, blockouts, and business hours in a multi-tenant environment.

## Features

- Role-based calendar views (clients, stylists, admin)
- Real-time updates using GraphQL subscriptions
- Event management (appointments, blockouts, special events)
- Resource scheduling (stylists, rooms, equipment)
- Business hours management
- Customizable event colors and metadata
- Responsive design with Tailwind CSS

## Components

### UnifiedCalendar

The main calendar component that provides a unified view of all events. It supports:

- Multiple view types (month, week, day, agenda)
- Event creation and management
- Resource filtering
- Real-time updates

```tsx
import { UnifiedCalendar } from './components/Calendar';
import { dateFnsLocalizer } from 'react-big-calendar';

const Calendar = () => (
  <UnifiedCalendar
    localizer={dateFnsLocalizer}
    defaultView="week"
    defaultDate={new Date()}
  />
);
```

### CalendarToolbar

A customizable toolbar component that provides:

- Navigation controls
- View switching
- Role-based actions
- Date range display

### EventPopover

A popover component for displaying and managing event details:

- Event information
- Status management
- Edit and delete actions
- Role-based permissions

## Hooks

### useCalendar

A custom hook that manages calendar state and operations:

```tsx
const {
  loading,
  error,
  view,
  date,
  events,
  resources,
  blockouts,
  businessHours,
  onNavigate,
  onViewChange,
  onSelectEvent,
  onEventStatusChange,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onCreateBlockout,
  onUpdateBusinessHours
} = useCalendar({
  defaultView: 'week',
  defaultDate: new Date()
});
```

## GraphQL Operations

### Queries

- `GET_CALENDAR_VIEW`: Fetches calendar data including events, resources, blockouts, and business hours

### Mutations

- `CREATE_EVENT`: Creates a new event
- `UPDATE_EVENT`: Updates an existing event
- `DELETE_EVENT`: Deletes an event
- `UPDATE_EVENT_STATUS`: Updates event status
- `CREATE_BLOCKOUT`: Creates a new blockout period
- `UPDATE_BUSINESS_HOURS`: Updates business hours

### Subscriptions

- `CALENDAR_UPDATED`: Real-time updates for calendar events
- `BUSINESS_HOURS_UPDATED`: Real-time updates for business hours
- `BLOCKOUT_UPDATED`: Real-time updates for blockouts

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```env
REACT_APP_GRAPHQL_URI=your_graphql_endpoint
REACT_APP_WS_URI=your_websocket_endpoint
```

3. Start the development server:
```bash
npm start
```

## Development

### Adding New Event Types

1. Update the `EventType` type in `types/calendar.ts`
2. Add corresponding GraphQL schema updates
3. Implement new event handling in `UnifiedCalendar`
4. Update event display in `EventPopover`

### Customizing Styles

The calendar uses Tailwind CSS for styling. Customize the appearance by:

1. Modifying class names in components
2. Updating the Tailwind configuration
3. Adding custom CSS in `styles/calendar.css`

## Best Practices

1. Always handle loading and error states
2. Implement proper role-based access control
3. Validate date ranges and business hours
4. Use optimistic updates for better UX
5. Handle timezone differences appropriately
6. Implement proper error boundaries
7. Use TypeScript for type safety

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT 