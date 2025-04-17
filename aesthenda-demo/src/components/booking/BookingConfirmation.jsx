import React from 'react';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

const BookingConfirmation = ({ bookingData, tenantName, onComplete }) => {
  // Run confetti animation on component mount
  React.useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      // Create confetti burst at different positions
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2
        }
      });
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2
        }
      });
    }, 250);
    
    return () => clearInterval(interval);
  }, []);
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Format currency values
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };
  
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Booking Confirmed!</h2>
        <p className="mt-2 text-gray-600">
          Your appointment at {tenantName} has been successfully booked.
        </p>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg text-left mb-8">
        <h3 className="text-lg font-medium mb-4 text-gray-900">Appointment Details</h3>
        
        <div className="space-y-3">
          <p>
            <span className="font-medium">Date:</span> {formatDate(bookingData.date)}
          </p>
          <p>
            <span className="font-medium">Time:</span> {bookingData.time}
          </p>
          <p>
            <span className="font-medium">Services:</span> {bookingData.services.map(service => service.name).join(', ')}
          </p>
          <p>
            <span className="font-medium">Stylist:</span> {bookingData.stylistName}
          </p>
          {bookingData.totalPrice > 0 && (
            <p>
              <span className="font-medium">Total:</span> {formatCurrency(bookingData.totalPrice)}
            </p>
          )}
          {bookingData.payment && bookingData.payment.paymentStatus && (
            <p>
              <span className="font-medium">Payment:</span> {
                bookingData.payment.paymentStatus === 'completed' ? 'Paid online' :
                bookingData.payment.paymentStatus === 'pay_at_salon' ? 'Pay at salon' :
                bookingData.payment.paymentStatus
              }
            </p>
          )}
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium mb-2 text-gray-900">Customer Information</h4>
          <p>{bookingData.customer.firstName} {bookingData.customer.lastName}</p>
          <p>{bookingData.customer.email}</p>
          <p>{bookingData.customer.phone}</p>
        </div>
        
        {bookingData.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-medium mb-2 text-gray-900">Notes</h4>
            <p className="text-gray-600">{bookingData.notes}</p>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="mb-4 text-gray-600">
          A confirmation email has been sent to {bookingData.customer.email} with these details.
        </p>
        
        <button
          onClick={onComplete}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation; 