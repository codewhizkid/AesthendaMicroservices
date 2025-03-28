import React, { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing form state
 * @param {Object} initialValues - The initial form values
 * @returns {Object} Form state and handlers
 */
export const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Reset the form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialValues]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    setIsDirty(true);
  }, []);

  // Handle direct value change (not from an event)
  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    setIsDirty(true);
  }, []);

  // Handle multiple values at once
  const setMultipleValues = useCallback((valueObject) => {
    setValues(prev => ({
      ...prev,
      ...valueObject
    }));
    
    setIsDirty(true);
  }, []);

  // Mark a field as touched (for validation)
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  // Set a validation error
  const setError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    values,
    errors,
    touched,
    isDirty,
    handleChange,
    handleBlur,
    setValue,
    setValues: setMultipleValues,
    setError,
    clearErrors,
    resetForm
  };
};

/**
 * Custom hook to manage asynchronous operations
 * @param {Function} asyncFunction - The async function to execute
 * @param {boolean} immediate - Whether to execute the function immediately
 * @returns {Object} Status and control functions
 */
export const useAsync = (asyncFunction, immediate = false) => {
  const [status, setStatus] = useState('idle');
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  // Execute the async function
  const execute = useCallback(async (...params) => {
    setStatus('pending');
    setValue(null);
    setError(null);
    
    try {
      const response = await asyncFunction(...params);
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  // Execute immediately on mount if specified
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, value, error, isLoading: status === 'pending' };
};

/**
 * Loading spinner component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Loading spinner
 */
export const LoadingSpinner = ({ size = 'md', color = 'primary-600' }) => {
  const sizeClass = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }[size] || 'h-8 w-8';

  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full ${sizeClass} border-b-2 border-${color}`}></div>
    </div>
  );
};

/**
 * Empty state component for lists with no items
 * @param {Object} props - Component props
 * @returns {JSX.Element} Empty state component
 */
export const EmptyState = ({ 
  title = 'No items found', 
  message = 'There are no items to display yet.', 
  icon,
  actionLabel,
  onAction
}) => {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/**
 * Custom hook for confirmation dialogs
 * @returns {Object} Dialog state and handlers
 */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    confirmVariant: 'danger',
    onConfirm: () => {},
    onCancel: () => {},
    data: null
  });
  
  // Open the confirmation dialog
  const openConfirmDialog = useCallback((options = {}) => {
    const newConfig = { ...config, ...options };
    setConfig(newConfig);
    setIsOpen(true);
    
    return new Promise((resolve, reject) => {
      newConfig.onConfirm = () => {
        resolve(true);
        setIsOpen(false);
      };
      
      newConfig.onCancel = () => {
        resolve(false);
        setIsOpen(false);
      };
    });
  }, [config]);
  
  // Close the dialog
  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  // Dialog component to render
  const ConfirmDialog = () => {
    if (!isOpen) return null;
    
    // Style based on variant
    const buttonStyle = {
      primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
      danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
    }[config.confirmVariant || 'primary'];
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Background overlay */}
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={config.onCancel}></div>
          
          {/* Center dialog */}
          <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">{config.title}</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{config.message}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className={`inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white border border-transparent rounded-md shadow-sm sm:ml-3 sm:w-auto sm:text-sm ${buttonStyle}`}
                onClick={config.onConfirm}
              >
                {config.confirmLabel}
              </button>
              <button
                type="button"
                className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={config.onCancel}
              >
                {config.cancelLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return {
    openConfirmDialog,
    closeDialog,
    ConfirmDialog
  };
};

/**
 * Format a monetary value to a currency string
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatMoney = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Format a date to a user-friendly string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(new Date(date));
};

/**
 * Format a time string
 * @param {string} time - Time string in 24h format (HH:MM)
 * @param {boolean} use12Hour - Whether to use 12-hour format with AM/PM
 * @returns {string} Formatted time string
 */
export const formatTime = (time, use12Hour = true) => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  
  if (!use12Hour) {
    return `${hours}:${minutes}`;
  }
  
  return hour === 0 ? `12:${minutes} AM` :
         hour === 12 ? `12:${minutes} PM` :
         hour < 12 ? `${hour}:${minutes} AM` :
         `${hour - 12}:${minutes} PM`;
};

/**
 * Truncate text with ellipsis if it exceeds a certain length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if necessary
 */
export const truncateText = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return text.substring(0, length) + '...';
};

export default {
  useForm,
  useAsync,
  useConfirmDialog,
  LoadingSpinner,
  EmptyState,
  formatMoney,
  formatDate,
  formatTime,
  truncateText
};