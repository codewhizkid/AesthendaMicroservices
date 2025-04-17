# Aesthenda Frontend Development Patterns

This document outlines the standard patterns and practices used in the Aesthenda frontend application. Following these patterns ensures consistency across the codebase and makes maintenance easier.

## Component Structure

### Page Components

Page components should follow this structure:
```jsx
const PageName = () => {
  // 1. State declarations
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // 2. Hook declarations (context, etc.)
  const { someContext } = useContext();

  // 3. Effects
  useEffect(() => {
    fetchData();
  }, [dependencies]);

  // 4. Helper functions
  const showToast = (message, type) => {
    setToast({ message, type });
  };

  // 5. Handler functions
  const handleAction = async () => {
    try {
      // Implementation
      showToast('Success message', ToastTypes.SUCCESS);
    } catch (error) {
      console.error('Error:', error);
      showToast(error.message, ToastTypes.ERROR);
    }
  };

  // 6. Render logic
  return (
    <DashboardLayout title="Page Title">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <MainContent />
      )}
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
};
```

### Loading States

Always use the `LoadingSpinner` component for loading states:
```jsx
<div className="flex justify-center items-center p-12">
  <LoadingSpinner size="lg" />
</div>
```

### Error States

Use the standard error component structure:
```jsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4">
  <div className="flex">
    <div className="flex-shrink-0">
      <ErrorIcon />
    </div>
    <div className="ml-3">
      <h3 className="text-sm font-medium text-red-800">Error</h3>
      <div className="mt-2 text-sm text-red-700">{errorMessage}</div>
    </div>
  </div>
</div>
```

### Toast Notifications

Use the custom Toast component for notifications:
```jsx
const [toast, setToast] = useState(null);

const showToast = (message, type) => {
  setToast({ message, type });
};

// In the render:
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
```

## Styling Patterns

### Tailwind CSS Classes

1. **Layout Classes**:
   - Flex layouts: `flex`, `flex-col`, `items-center`, `justify-center`
   - Grid layouts: `grid`, `grid-cols-{n}`, `gap-{size}`
   - Spacing: `p-{size}`, `m-{size}`, `space-y-{size}`

2. **Component Classes**:
   - Cards: `bg-white rounded-lg shadow-sm border border-gray-200`
   - Forms: `form-input`, `form-select`, `form-checkbox`
   - Buttons: `btn-primary`, `btn-secondary`, `btn-danger`

3. **Text Classes**:
   - Headings: `text-{size} font-{weight} text-gray-900`
   - Body: `text-sm text-gray-600`
   - Links: `text-primary-600 hover:text-primary-700`

### Common Layouts

1. **Page Layout**:
```jsx
<DashboardLayout title="Page Title">
  <div className="space-y-6">
    <PageHeader />
    <MainContent />
  </div>
</DashboardLayout>
```

2. **Form Layout**:
```jsx
<form className="space-y-4">
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">Label</label>
    <input className="form-input w-full" />
  </div>
</form>
```

## API Integration Patterns

### Data Fetching

1. **Loading State Management**:
```jsx
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

try {
  setLoading(true);
  setError(null);
  // API call
} catch (error) {
  setError(error.message);
} finally {
  setLoading(false);
}
```

2. **Error Handling**:
```jsx
try {
  const result = await apiCall();
  if (result.success) {
    // Handle success
  } else {
    throw new Error(result.error || 'Default error message');
  }
} catch (error) {
  console.error('Error:', error);
  showToast(error.message, ToastTypes.ERROR);
}
```

## Testing Patterns

1. **Mock API Toggle**:
```jsx
if (ENABLE_MOCK_API) {
  // Mock implementation
} else {
  // Real API implementation
}
```

## Best Practices

1. **State Management**:
   - Use local state for component-specific data
   - Use context for shared application state
   - Keep state updates atomic and predictable

2. **Performance**:
   - Memoize callbacks with useCallback when passed as props
   - Use useMemo for expensive computations
   - Implement proper dependency arrays in useEffect

3. **Error Handling**:
   - Always provide user-friendly error messages
   - Log errors to console in development
   - Use try-catch blocks for async operations

4. **Code Organization**:
   - Group related functionality
   - Keep components focused and single-responsibility
   - Use consistent file and folder naming conventions

## Component Library

Our application uses the following common components:

1. `LoadingSpinner`: For loading states
2. `Toast`: For notifications
3. `ErrorBoundary`: For catching and displaying errors
4. `DashboardLayout`: For page layout structure
5. `Button`: For consistent button styling
6. `Input`: For form inputs
7. `Select`: For dropdowns
8. `Modal`: For dialogs and popups

Refer to the component documentation for specific usage details and props.

## Additional Documentation

For specific feature implementations, refer to:

- [Navigation & Routing](./navigation/ROUTES.md)
- [Client Booking System](./BOOKING_SYSTEM.md)