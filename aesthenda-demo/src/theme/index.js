// Theme configuration for the application
// This serves as a single source of truth for styling

export const theme = {
  colors: {
    primary: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
    secondary: {
      50: '#F0FFF4',
      100: '#C6F6D5',
      200: '#9AE6B4',
      300: '#68D391',
      400: '#48BB78',
      500: '#38A169',
      600: '#2F855A',
      700: '#276749',
      800: '#22543D',
      900: '#1C4532',
    },
    accent: {
      50: '#FFF5F5',
      100: '#FED7D7',
      200: '#FEB2B2',
      300: '#FC8181',
      400: '#F56565',
      500: '#E53E3E',
      600: '#C53030',
      700: '#9B2C2C',
      800: '#822727',
      900: '#63171B',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px',
  },
  typography: {
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

// Utility function to get theme values
export const getThemeValue = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme);
};

// Common component styles
export const commonStyles = {
  button: {
    base: 'px-4 py-2 rounded-md font-medium transition-colors duration-200',
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700',
    outline: 'border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
  },
  input: {
    base: 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2',
    default: 'border-gray-300 focus:border-primary-500 focus:ring-primary-200',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-200',
  },
  card: {
    base: 'bg-white rounded-lg shadow-md overflow-hidden',
    hover: 'hover:shadow-lg transition-shadow duration-200',
  },
};

// Export reusable component classes
export const componentClasses = {
  modal: {
    overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4',
    content: 'bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto',
    header: 'px-6 py-4 border-b',
    body: 'px-6 py-4',
    footer: 'px-6 py-4 border-t bg-gray-50',
  },
  calendar: {
    container: 'bg-white rounded-lg shadow-md p-4',
    header: 'flex items-center justify-between mb-4',
    grid: 'grid grid-cols-7 gap-1',
    cell: {
      base: 'p-2 border rounded-md transition-colors duration-200',
      today: 'bg-primary-50 border-primary-500',
      selected: 'bg-primary-100 border-primary-600',
      disabled: 'bg-gray-50 text-gray-400',
    },
  },
};