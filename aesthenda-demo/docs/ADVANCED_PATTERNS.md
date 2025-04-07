# Advanced Development Patterns

## Complete Page Examples

### 1. Service Management Page

This example demonstrates how multiple components work together in a complete view:

```jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Toast, { ToastTypes } from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useTenant } from '../context/TenantContext';
import serviceApi from '../api/serviceApi';

const ServiceManagement = () => {
  // 1. State Management
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  
  const { tenantData } = useTenant();

  // 2. Effects
  useEffect(() => {
    fetchServices();
  }, []);

  // 3. API Integration
  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await serviceApi.getServices(tenantData.id);
      if (result.success) {
        setServices(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setError('Failed to load services');
      showToast(error.message, ToastTypes.ERROR);
    } finally {
      setLoading(false);
    }
  };

  // 4. Event Handlers
  const handleAddService = async (serviceData) => {
    try {
      const result = await serviceApi.createService({
        tenantId: tenantData.id,
        ...serviceData
      });
      if (result.success) {
        setServices([...services, result.data]);
        showToast('Service added successfully', ToastTypes.SUCCESS);
        setIsModalOpen(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showToast(error.message, ToastTypes.ERROR);
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  // 5. Render Helpers
  const renderServiceCard = (service) => (
    <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
          <p className="text-sm text-gray-600">{service.description}</p>
          <div className="mt-2">
            <span className="text-sm font-medium text-gray-900">
              ${service.price}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              ({service.duration} min)
            </span>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setSelectedService(service);
            setIsModalOpen(true);
          }}
        >
          Edit
        </Button>
      </div>
    </div>
  );

  // 6. Main Render
  return (
    <DashboardLayout 
      title="Service Management"
      actions={
        <Button
          variant="primary"
          onClick={() => {
            setSelectedService(null);
            setIsModalOpen(true);
          }}
        >
          Add Service
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(renderServiceCard)}
          </div>
        </div>
      )}

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddService}
        service={selectedService}
      />

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

export default ServiceManagement;
```

### 2. Form Handling Example

This example shows how to handle complex forms with validation:

```jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';

// 1. Form Schema
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[\d\s-]{10,}$/, 'Invalid phone number'),
  serviceId: z.string().min(1, 'Please select a service'),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  notes: z.string().optional(),
});

const BookingForm = ({ onSubmit, services }) => {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(schema)
  });

  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name"
          {...register('name')}
          error={errors.name?.message}
        />
        
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
        
        <Input
          label="Phone"
          {...register('phone')}
          error={errors.phone?.message}
        />
        
        <Select
          label="Service"
          {...register('serviceId')}
          options={services}
          error={errors.serviceId?.message}
        />
        
        <Input
          label="Date"
          type="date"
          {...register('date')}
          error={errors.date?.message}
        />
        
        <Input
          label="Time"
          type="time"
          {...register('time')}
          error={errors.time?.message}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Notes (optional)
        </label>
        <textarea
          {...register('notes')}
          className="form-textarea w-full rounded-md"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => reset()}
        >
          Reset
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          Submit Booking
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;
```

## Testing Guidelines

### 1. Component Testing

Use React Testing Library and Jest for testing components. Here's an example test suite:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookingForm from './BookingForm';

describe('BookingForm', () => {
  const mockOnSubmit = jest.fn();
  const mockServices = [
    { value: '1', label: 'Haircut' },
    { value: '2', label: 'Color' },
  ];

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('renders all form fields', () => {
    render(<BookingForm onSubmit={mockOnSubmit} services={mockServices} />);
    
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/service/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
  });

  it('displays validation errors for required fields', async () => {
    render(<BookingForm onSubmit={mockOnSubmit} services={mockServices} />);
    
    fireEvent.click(screen.getByText(/submit booking/i));
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<BookingForm onSubmit={mockOnSubmit} services={mockServices} />);
    
    await userEvent.type(screen.getByLabelText(/name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/phone/i), '+1234567890');
    await userEvent.selectOptions(screen.getByLabelText(/service/i), '1');
    await userEvent.type(screen.getByLabelText(/date/i), '2024-03-20');
    await userEvent.type(screen.getByLabelText(/time/i), '14:00');
    
    fireEvent.click(screen.getByText(/submit booking/i));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        serviceId: '1',
        date: '2024-03-20',
        time: '14:00',
        notes: ''
      });
    });
  });
});
```

### 2. Integration Testing

For integration tests, focus on user flows:

```jsx
describe('Service Management Integration', () => {
  it('completes the full service creation flow', async () => {
    render(<ServiceManagement />);
    
    // Click add service button
    await userEvent.click(screen.getByText(/add service/i));
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText(/service name/i), 'New Service');
    await userEvent.type(screen.getByLabelText(/price/i), '99.99');
    await userEvent.type(screen.getByLabelText(/duration/i), '60');
    
    // Submit the form
    await userEvent.click(screen.getByText(/save/i));
    
    // Verify success message
    expect(await screen.findByText(/service added successfully/i)).toBeInTheDocument();
    
    // Verify new service appears in the list
    expect(screen.getByText('New Service')).toBeInTheDocument();
  });
});
```

## Styling & Theming Integration

### 1. Theme Configuration

Our Tailwind CSS theme is configured in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... other shades
          600: '#0284c7',
          700: '#0369a1',
        },
        // ... other color scales
      },
      spacing: {
        // Custom spacing scale
      },
      borderRadius: {
        // Custom border radius scale
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
```

### 2. Component-Specific Styles

Create consistent component styles using Tailwind CSS classes:

```jsx
// Button.jsx
const variantStyles = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const Button = ({ variant = 'primary', size = 'md', className, ...props }) => (
  <button
    className={`
      inline-flex items-center justify-center
      font-medium rounded-md
      focus:outline-none focus:ring-2 focus:ring-offset-2
      transition-colors duration-200
      disabled:opacity-50 disabled:cursor-not-allowed
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `}
    {...props}
  />
);
```

### 3. Responsive Design

Follow these patterns for responsive layouts:

```jsx
// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>

// Flexbox layouts
<div className="flex flex-col md:flex-row md:space-x-4">
  {/* Flex items */}
</div>

// Typography
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  {/* Heading content */}
</h1>

// Spacing
<div className="p-4 md:p-6 lg:p-8">
  {/* Content with responsive padding */}
</div>
```