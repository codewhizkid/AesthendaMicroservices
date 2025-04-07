import React from 'react';

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const variants = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-600',
  white: 'text-white',
};

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'primary', 
  className = '',
  fullScreen = false 
}) => {
  const spinnerClasses = `
    animate-spin
    ${sizes[size]}
    ${variants[variant]}
    ${className}
  `.trim();

  const spinner = (
    <svg
      className={spinnerClasses}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-4">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 