import React, { useEffect } from 'react';

/**
 * Modal component for displaying content in a popup
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Content to display in the modal
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {Function} props.onClose Function to call when the modal is closed
 * @param {string} props.maxWidth Maximum width of the modal (default: max-w-lg)
 */
const Modal = ({ children, isOpen, onClose, maxWidth = 'max-w-lg' }) => {
  // Close the modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Close when clicking the backdrop (outside the modal content)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity"
      onClick={handleBackdropClick}
    >
      <div 
        className={`relative ${maxWidth} w-full transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal; 