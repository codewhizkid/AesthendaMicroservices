import React from 'react';

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

const LoadingSpinner = ({ size = 'md', color = 'blue-500', className = '' }) => {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-${color} ${sizeClass} ${className}`}></div>
  );
};

export default LoadingSpinner; 