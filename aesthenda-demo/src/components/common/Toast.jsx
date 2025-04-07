import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const TOAST_DURATION = 3000; // 3 seconds

export const ToastTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

const toastStyles = {
  base: 'fixed bottom-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg transform transition-all duration-300',
  success: 'bg-green-100 text-green-800 border border-green-200',
  error: 'bg-red-100 text-red-800 border border-red-200',
  info: 'bg-blue-100 text-blue-800 border border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  icon: {
    base: 'w-5 h-5 mr-2',
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500',
  },
};

const ToastIcon = ({ type }) => {
  switch (type) {
    case ToastTypes.SUCCESS:
      return (
        <svg className={`${toastStyles.icon.base} ${toastStyles.icon.success}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case ToastTypes.ERROR:
      return (
        <svg className={`${toastStyles.icon.base} ${toastStyles.icon.error}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case ToastTypes.WARNING:
      return (
        <svg className={`${toastStyles.icon.base} ${toastStyles.icon.warning}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case ToastTypes.INFO:
    default:
      return (
        <svg className={`${toastStyles.icon.base} ${toastStyles.icon.info}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const Toast = ({ message, type = ToastTypes.INFO, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [onClose]);

  return createPortal(
    <div
      className={`${toastStyles.base} ${toastStyles[type]} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
      role="alert"
    >
      <ToastIcon type={type} />
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="ml-4 text-gray-400 hover:text-gray-600"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>,
    document.body
  );
};

export default Toast;