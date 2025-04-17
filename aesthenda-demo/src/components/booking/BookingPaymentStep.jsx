import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { tenantPaymentService } from '../../api/tenantPaymentService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const BookingPaymentStep = ({ 
  appointmentData, 
  onComplete, 
  onBack, 
  onError 
}) => {
  const { tenantId } = useParams();
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState(null);
  const [clientConfig, setClientConfig] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  
  // Elements for different payment providers
  const [stripeElements, setStripeElements] = useState(null);
  const [squareElements, setSquareElements] = useState(null);
  const [paypalReady, setPaypalReady] = useState(false);
  
  useEffect(() => {
    // Fetch tenant payment configuration
    const fetchPaymentConfig = async () => {
      try {
        setLoading(true);
        
        // Get client-side payment configuration
        const config = await tenantPaymentService.getClientConfig(tenantId);
        setClientConfig(config);
        
        // Initialize the active payment provider
        await initializePaymentProvider(config);
        
        // Create a payment intent for this appointment
        if (appointmentData && appointmentData.totalPrice > 0) {
          const payment = await tenantPaymentService.createPayment(tenantId, {
            appointmentId: appointmentData.id,
            customerId: appointmentData.userId,
            amount: appointmentData.totalPrice,
            description: `Appointment for ${appointmentData.services.map(s => s.name).join(', ')}`,
            metadata: {
              date: appointmentData.date,
              time: appointmentData.startTime,
              stylist: appointmentData.stylistName
            }
          });
          
          setPaymentIntent(payment);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading payment configuration:', err);
        setError('Unable to load payment options. Please try again later.');
        setLoading(false);
        if (onError) onError(err);
      }
    };
    
    fetchPaymentConfig();
    
    // Cleanup function
    return () => {
      // Clean up any payment provider resources
      if (stripeElements) {
        // Stripe cleanup if needed
      }
      
      if (squareElements) {
        // Square cleanup if needed
      }
    };
  }, [tenantId, appointmentData]);
  
  // Initialize the selected payment provider
  const initializePaymentProvider = async (config) => {
    if (!config || !config.activeProvider || !config.isEnabled) {
      return;
    }
    
    switch (config.activeProvider) {
      case 'stripe':
        await initializeStripe(config);
        break;
        
      case 'square':
        await initializeSquare(config);
        break;
        
      case 'paypal':
        await initializePayPal(config);
        break;
        
      default:
        console.warn(`Unknown payment provider: ${config.activeProvider}`);
    }
  };
  
  // Initialize Stripe
  const initializeStripe = async (config) => {
    if (!config.stripe || !config.stripe.publicKey) {
      setError('Stripe configuration is incomplete');
      return;
    }
    
    try {
      // Load Stripe.js dynamically
      const stripeJs = await loadScript('https://js.stripe.com/v3/');
      
      if (stripeJs) {
        // Initialize Stripe
        const stripe = window.Stripe(config.stripe.publicKey);
        const elements = stripe.elements();
        
        setStripeElements({ stripe, elements });
      }
    } catch (err) {
      console.error('Error initializing Stripe:', err);
      setError('Unable to initialize Stripe payment. Please try again later.');
    }
  };
  
  // Initialize Square
  const initializeSquare = async (config) => {
    if (!config.square || !config.square.applicationId || !config.square.locationId) {
      setError('Square configuration is incomplete');
      return;
    }
    
    try {
      // Load Square.js dynamically
      const squareJs = await loadScript('https://sandbox.web.squarecdn.com/v1/square.js');
      
      if (squareJs) {
        // Initialize Square
        const square = window.Square;
        
        // Initialize Square payments
        const payments = square.payments(config.square.applicationId, config.square.locationId);
        
        setSquareElements({ square, payments });
      }
    } catch (err) {
      console.error('Error initializing Square:', err);
      setError('Unable to initialize Square payment. Please try again later.');
    }
  };
  
  // Initialize PayPal
  const initializePayPal = async (config) => {
    if (!config.paypal || !config.paypal.clientId) {
      setError('PayPal configuration is incomplete');
      return;
    }
    
    try {
      // Load PayPal script dynamically
      const paypalSdk = await loadScript(`https://www.paypal.com/sdk/js?client-id=${config.paypal.clientId}&currency=${config.settings.currency}`);
      
      if (paypalSdk) {
        setPaypalReady(true);
      }
    } catch (err) {
      console.error('Error initializing PayPal:', err);
      setError('Unable to initialize PayPal. Please try again later.');
    }
  };
  
  // Helper to dynamically load scripts
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  };
  
  // Handle payment submission
  const handlePaymentSubmit = async (paymentMethodData) => {
    if (!clientConfig || !paymentIntent) {
      setError('Payment configuration is not ready');
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      // Process payment based on the active provider
      let result;
      
      switch (clientConfig.activeProvider) {
        case 'stripe':
          result = await processStripePayment(paymentMethodData);
          break;
          
        case 'square':
          result = await processSquarePayment(paymentMethodData);
          break;
          
        case 'paypal':
          result = await processPayPalPayment(paymentMethodData);
          break;
          
        default:
          throw new Error(`Unsupported payment provider: ${clientConfig.activeProvider}`);
      }
      
      if (result.success) {
        // Complete the payment on the server
        await tenantPaymentService.completePayment(tenantId, paymentIntent.paymentIntentId, {
          paymentMethodId: result.paymentMethodId
        });
        
        // Call onComplete with payment details
        onComplete({
          paymentId: paymentIntent.paymentIntentId,
          paymentStatus: 'completed',
          paymentAmount: paymentIntent.amount,
          paymentCurrency: paymentIntent.currency
        });
      } else {
        setError(result.error || 'Payment processing failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'An error occurred during payment processing');
      if (onError) onError(err);
    } finally {
      setProcessingPayment(false);
    }
  };
  
  // Process Stripe payment
  const processStripePayment = async (paymentMethodData) => {
    const { stripe, elements } = stripeElements;
    
    const result = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
      payment_method: paymentMethodData.id
    });
    
    if (result.error) {
      return {
        success: false,
        error: result.error.message
      };
    }
    
    return {
      success: true,
      paymentMethodId: paymentMethodData.id
    };
  };
  
  // Process Square payment
  const processSquarePayment = async (paymentMethodData) => {
    // Implementation depends on Square's SDK
    // This is a simplified example
    return {
      success: true,
      paymentMethodId: paymentMethodData.id
    };
  };
  
  // Process PayPal payment
  const processPayPalPayment = async (paymentMethodData) => {
    // Implementation depends on PayPal's SDK
    // This is a simplified example
    return {
      success: true,
      paymentMethodId: paymentMethodData.id
    };
  };
  
  // Render appropriate payment form based on active provider
  const renderPaymentForm = () => {
    if (!clientConfig || !clientConfig.isEnabled) {
      return (
        <div className="p-4 text-center">
          <p>Pay at salon. No online payment required.</p>
          <button 
            onClick={() => onComplete({ paymentStatus: 'pay_at_salon' })}
            className="mt-4 w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Complete Booking
          </button>
        </div>
      );
    }
    
    if (!paymentIntent) {
      return (
        <div className="p-4 text-center">
          <p>No payment required for this appointment.</p>
          <button 
            onClick={() => onComplete({ paymentStatus: 'not_required' })}
            className="mt-4 w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Complete Booking
          </button>
        </div>
      );
    }
    
    switch (clientConfig.activeProvider) {
      case 'stripe':
        return renderStripeForm();
        
      case 'square':
        return renderSquareForm();
        
      case 'paypal':
        return renderPayPalForm();
        
      default:
        return (
          <div className="p-4 text-center text-red-600">
            Unsupported payment provider
          </div>
        );
    }
  };
  
  // Render Stripe payment form
  const renderStripeForm = () => {
    if (!stripeElements) {
      return <div>Loading Stripe...</div>;
    }
    
    // In a real implementation, you would use Stripe Elements here
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">Card Payment</h3>
        <div id="stripe-card-element" className="p-3 border rounded-md mb-4">
          {/* Stripe Elements would mount here */}
          <p className="text-sm text-gray-500 text-center">
            Stripe Elements placeholder
          </p>
        </div>
        <button 
          onClick={() => handlePaymentSubmit({ id: 'mock_stripe_pm_id' })}
          disabled={processingPayment}
          className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
        >
          {processingPayment ? 'Processing...' : `Pay ${formatPrice(paymentIntent.amount, paymentIntent.currency)}`}
        </button>
      </div>
    );
  };
  
  // Render Square payment form
  const renderSquareForm = () => {
    if (!squareElements) {
      return <div>Loading Square...</div>;
    }
    
    // In a real implementation, you would use Square Web Payments SDK here
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">Square Payment</h3>
        <div id="square-card-container" className="p-3 border rounded-md mb-4">
          {/* Square payment form would mount here */}
          <p className="text-sm text-gray-500 text-center">
            Square payment form placeholder
          </p>
        </div>
        <button 
          onClick={() => handlePaymentSubmit({ id: 'mock_square_pm_id' })}
          disabled={processingPayment}
          className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
        >
          {processingPayment ? 'Processing...' : `Pay ${formatPrice(paymentIntent.amount, paymentIntent.currency)}`}
        </button>
      </div>
    );
  };
  
  // Render PayPal payment form
  const renderPayPalForm = () => {
    if (!paypalReady) {
      return <div>Loading PayPal...</div>;
    }
    
    // In a real implementation, you would use PayPal Buttons here
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">PayPal Payment</h3>
        <div id="paypal-button-container" className="mb-4">
          {/* PayPal buttons would mount here */}
          <div className="p-3 border rounded-md text-center">
            <p className="text-sm text-gray-500">PayPal buttons placeholder</p>
          </div>
        </div>
        <button 
          onClick={() => handlePaymentSubmit({ id: 'mock_paypal_pm_id' })}
          disabled={processingPayment}
          className="w-full py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
        >
          {processingPayment ? 'Processing...' : `Complete PayPal Payment`}
        </button>
      </div>
    );
  };
  
  // Helper to format price
  const formatPrice = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="medium" />
        <span className="ml-2">Loading payment options...</span>
      </div>
    );
  }
  
  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Payment</h2>
      
      {appointmentData && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-2">Appointment Summary</h3>
          <div className="text-sm">
            <p><span className="font-medium">Date:</span> {new Date(appointmentData.date).toLocaleDateString()}</p>
            <p><span className="font-medium">Time:</span> {appointmentData.startTime}</p>
            <p><span className="font-medium">Services:</span> {appointmentData.services.map(s => s.name).join(', ')}</p>
            <p><span className="font-medium">Stylist:</span> {appointmentData.stylistName}</p>
            {appointmentData.totalPrice > 0 && (
              <p className="text-lg mt-2">
                <span className="font-medium">Total:</span> {formatPrice(appointmentData.totalPrice, clientConfig?.settings?.currency)}
              </p>
            )}
          </div>
        </div>
      )}
      
      {error && (
        <ErrorMessage message={error} className="mb-4" />
      )}
      
      {renderPaymentForm()}
      
      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={processingPayment}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default BookingPaymentStep; 