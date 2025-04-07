# Components Directory

This directory contains all reusable components used throughout the Aesthenda application. Each component follows our established patterns and styling guidelines using Tailwind CSS.

## Common Components

### LoadingSpinner

```jsx
import LoadingSpinner from '../components/common/LoadingSpinner';

// Usage
<LoadingSpinner size="sm" /> // Small spinner
<LoadingSpinner size="md" /> // Medium spinner (default)
<LoadingSpinner size="lg" /> // Large spinner

// With container
<div className="flex justify-center items-center p-12">
  <LoadingSpinner size="lg" />
</div>
```

### Toast

```jsx
import Toast, { ToastTypes } from '../components/common/Toast';

// Component state
const [toast, setToast] = useState(null);

// Show toast helper
const showToast = (message, type) => {
  setToast({ message, type });
};

// Usage
showToast('Operation successful', ToastTypes.SUCCESS);
showToast('Something went wrong', ToastTypes.ERROR);
showToast('Please note', ToastTypes.INFO);
showToast('Be careful', ToastTypes.WARNING);

// Render
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
```

### ErrorBoundary

```jsx
import ErrorBoundary from '../components/common/ErrorBoundary';

// Usage
<ErrorBoundary fallbackMessage="Custom error message">
  <YourComponent />
</ErrorBoundary>

// With custom error UI
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### DashboardLayout

```jsx
import DashboardLayout from '../components/dashboard/DashboardLayout';

// Basic usage
<DashboardLayout title="Page Title">
  <YourContent />
</DashboardLayout>

// With actions
<DashboardLayout 
  title="Page Title"
  actions={
    <button className="btn-primary">
      New Item
    </button>
  }
>
  <YourContent />
</DashboardLayout>
```

### Button

```jsx
import Button from '../components/common/Button';

// Variants
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="danger">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With loading state
<Button loading>Processing...</Button>

// Disabled state
<Button disabled>Cannot Click</Button>
```

### Input

```jsx
import Input from '../components/common/Input';

// Basic usage
<Input
  label="Email"
  name="email"
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={handleChange}
/>

// With error
<Input
  label="Username"
  error="Username is required"
  value={username}
  onChange={handleChange}
/>

// With helper text
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
  value={password}
  onChange={handleChange}
/>
```

### Select

```jsx
import Select from '../components/common/Select';

// Basic usage
<Select
  label="Country"
  value={selectedCountry}
  onChange={handleChange}
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ]}
/>

// With placeholder
<Select
  label="Select a service"
  placeholder="Choose a service"
  value={selectedService}
  onChange={handleChange}
  options={services}
/>
```

### Modal

```jsx
import Modal from '../components/common/Modal';

// Component state
const [isOpen, setIsOpen] = useState(false);

// Usage
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  <div className="space-y-4">
    <p>Are you sure you want to proceed?</p>
    <div className="flex justify-end space-x-3">
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </div>
  </div>
</Modal>
```

## Directory Structure

```
components/
├── common/          # Shared components used across the app
├── dashboard/       # Dashboard-specific components
├── calendar/        # Calendar and appointment related components
├── forms/           # Form-specific components
└── layout/          # Layout components
```

## Best Practices

1. Always use TypeScript props interface for component props
2. Include prop documentation using JSDoc comments
3. Use Tailwind CSS for styling
4. Keep components focused and single-responsibility
5. Use proper error handling and loading states
6. Include proper accessibility attributes
7. Test components thoroughly

## Contributing

When adding new components:

1. Follow the established patterns in this document
2. Add proper documentation and usage examples
3. Include test cases
4. Update this README with new component documentation