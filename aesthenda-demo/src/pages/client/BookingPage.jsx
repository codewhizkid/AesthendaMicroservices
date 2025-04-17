import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_TENANT } from '../../graphql/queries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ServiceSelectionStep from '../../components/booking/ServiceSelectionStep';
import DateTimeSelectionStep from '../../components/booking/DateTimeSelectionStep';
import StylistSelectionStep from '../../components/booking/StylistSelectionStep';
import CustomerInfoStep from '../../components/booking/CustomerInfoStep';
import BookingConfirmation from '../../components/booking/BookingConfirmation';

// Define the steps in the booking wizard
const STEPS = {
  SERVICES: 'services',
  DATETIME: 'datetime',
  STYLIST: 'stylist',
  CUSTOMER_INFO: 'customer_info',
  PAYMENT: 'payment',
  CONFIRMATION: 'confirmation'
};

const BookingPage = () => {
  const { tenantId, step } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(step || STEPS.SERVICES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Booking data state
  const [bookingData, setBookingData] = useState({
    services: [],
    date: null,
    time: '',
    stylistId: '',
    stylistName: '',
    customer: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    notes: '',
    totalPrice: 0,
    payment: null
  });
  
  // Query to get tenant information for branding
  const { data: tenantData, loading: tenantLoading, error: tenantError } = useQuery(GET_TENANT, {
    variables: { id: tenantId },
    skip: !tenantId
  });

  // Set up loading and error states
  useEffect(() => {
    if (!tenantLoading && tenantData) {
      setLoading(false);
    }
    
    if (tenantError) {
      setError('Unable to load salon information. Please try again later.');
      setLoading(false);
    }
  }, [tenantLoading, tenantData, tenantError]);

  // Update booking data
  const updateBookingData = (data) => {
    setBookingData(prevData => ({
      ...prevData,
      ...data
    }));
  };

  // Navigate to next step
  const goToNextStep = () => {
    const nextStep = getNextStep();
    setCurrentStep(nextStep);
    navigate(`/${tenantId}/booking/${nextStep}`, { replace: true });
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    const prevStep = getPreviousStep();
    setCurrentStep(prevStep);
    navigate(`/${tenantId}/booking/${prevStep}`, { replace: true });
  };

  // Get the next step in the booking flow
  const getNextStep = () => {
    switch (currentStep) {
      case STEPS.SERVICES:
        return STEPS.DATETIME;
      case STEPS.DATETIME:
        return STEPS.STYLIST;
      case STEPS.STYLIST:
        return STEPS.CUSTOMER_INFO;
      case STEPS.CUSTOMER_INFO:
        return STEPS.PAYMENT;
      case STEPS.PAYMENT:
        return STEPS.CONFIRMATION;
      default:
        return STEPS.CONFIRMATION;
    }
  };

  // Get the previous step in the booking flow
  const getPreviousStep = () => {
    switch (currentStep) {
      case STEPS.DATETIME:
        return STEPS.SERVICES;
      case STEPS.STYLIST:
        return STEPS.DATETIME;
      case STEPS.CUSTOMER_INFO:
        return STEPS.STYLIST;
      case STEPS.PAYMENT:
        return STEPS.CUSTOMER_INFO;
      case STEPS.CONFIRMATION:
        return STEPS.PAYMENT;
      default:
        return STEPS.SERVICES;
    }
  };

  // Handle service selection update
  const handleServicesChange = (services) => {
    updateBookingData({ services });
  };

  // Handle date selection update
  const handleDateChange = (date) => {
    updateBookingData({ date, time: '' }); // Reset time when date changes
  };

  // Handle time selection update
  const handleTimeChange = (time) => {
    updateBookingData({ time });
  };

  // Handle stylist selection update
  const handleStylistSelect = ({ stylistId, stylistName }) => {
    updateBookingData({ stylistId, stylistName });
  };

  // Handle customer info update
  const handleCustomerInfoChange = (customerInfo) => {
    updateBookingData({ customer: customerInfo });
  };

  // Handle notes update
  const handleNotesChange = (notes) => {
    updateBookingData({ notes });
  };

  // If no tenant ID is provided, show error
  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <ErrorMessage message="No salon identifier provided. Please check your link and try again." />
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error if tenant not found
  if (error || !tenantData?.tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <ErrorMessage message={error || 'Salon not found. Please check your link and try again.'} />
        </div>
      </div>
    );
  }

  // Get tenant information
  const tenant = tenantData.tenant;
  const primaryColor = tenant.settings?.branding?.primaryColor || '#0ea5e9';
  
  // Set document title with tenant name
  useEffect(() => {
    if (tenant) {
      document.title = `Book Appointment | ${tenant.businessName}`;
    }
  }, [tenant]);

  // Determine which step to render
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.SERVICES:
        return (
          <ServiceSelectionStep
            tenantId={tenantId}
            selectedServices={bookingData.services}
            onServicesChange={handleServicesChange}
            onNext={goToNextStep}
            onBack={() => navigate(`/${tenantId}`)}
          />
        );
      
      case STEPS.DATETIME:
        return (
          <DateTimeSelectionStep
            tenantId={tenantId}
            selectedServices={bookingData.services}
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            onDateChange={handleDateChange}
            onTimeChange={handleTimeChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      
      case STEPS.STYLIST:
        return (
          <StylistSelectionStep 
            tenantId={tenantId}
            selectedServices={bookingData.services}
            selectedDate={bookingData.date}
            selectedTime={bookingData.time}
            selectedStylistId={bookingData.stylistId}
            onStylistSelect={handleStylistSelect}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      
      case STEPS.CUSTOMER_INFO:
        return (
          <CustomerInfoStep
            customerInfo={bookingData.customer}
            notes={bookingData.notes}
            onCustomerInfoChange={handleCustomerInfoChange}
            onNotesChange={handleNotesChange}
            onNext={goToNextStep}
            onBack={goToPreviousStep}
          />
        );
      
      // Other steps will be added as we develop them
      case STEPS.PAYMENT:
        return <div>Payment Step (Coming Soon)</div>;
      
      case STEPS.CONFIRMATION:
        return <BookingConfirmation bookingData={bookingData} tenantId={tenantId} />;
      
      default:
        return <div>Step not found</div>;
    }
  };

  // Calculate current step number for progress indicator
  const getStepNumber = () => {
    switch (currentStep) {
      case STEPS.SERVICES: return 1;
      case STEPS.DATETIME: return 2;
      case STEPS.STYLIST: return 3;
      case STEPS.CUSTOMER_INFO: return 4;
      case STEPS.PAYMENT: return 5;
      case STEPS.CONFIRMATION: return 6;
      default: return 1;
    }
  };

  // Get step label for progress indicator
  const getStepLabel = () => {
    switch (currentStep) {
      case STEPS.SERVICES: return 'Services';
      case STEPS.DATETIME: return 'Date & Time';
      case STEPS.STYLIST: return 'Stylist';
      case STEPS.CUSTOMER_INFO: return 'Your Details';
      case STEPS.PAYMENT: return 'Payment';
      case STEPS.CONFIRMATION: return 'Confirmation';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Tenant header with branding */}
      <header className="py-4 px-4 sm:px-6 bg-white shadow-sm" style={{ backgroundColor: `${primaryColor}10` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {tenant.settings?.branding?.logoUrl ? (
              <img 
                src={tenant.settings.branding.logoUrl} 
                alt={tenant.businessName} 
                className="h-8 w-auto cursor-pointer"
                onClick={() => navigate(`/${tenantId}`)}
              />
            ) : (
              <h1 
                className="text-lg font-bold cursor-pointer" 
                style={{ color: primaryColor }}
                onClick={() => navigate(`/${tenantId}`)}
              >
                {tenant.businessName}
              </h1>
            )}
          </div>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6">
          <nav className="flex justify-center">
            <ol className="flex items-center">
              {Object.values(STEPS).map((step, index) => {
                const stepNum = index + 1;
                const isActive = stepNum === getStepNumber();
                const isPast = stepNum < getStepNumber();
                
                return (
                  <li key={step} className="relative pr-8 last:pr-0 flex items-center">
                    {/* Line connecting steps */}
                    {index < Object.values(STEPS).length - 1 && (
                      <div className="absolute top-1/2 transform -translate-y-1/2 left-7 w-full h-0.5 bg-gray-200">
                        {isPast && <div className="absolute inset-0 bg-blue-500" style={{ backgroundColor: primaryColor }}></div>}
                      </div>
                    )}
                    
                    {/* Step circle */}
                    <div 
                      className={`
                        relative z-10 w-6 h-6 flex items-center justify-center rounded-full 
                        ${isActive 
                          ? 'border-2 border-blue-500 bg-white' 
                          : isPast 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                        }
                      `}
                      style={isActive ? { borderColor: primaryColor } : isPast ? { backgroundColor: primaryColor } : {}}
                    >
                      {isPast ? (
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-xs">{stepNum}</span>
                      )}
                    </div>
                    
                    {/* Step label (visible on medium screens and up) */}
                    <span className={`
                      hidden md:block ml-2 text-xs
                      ${isActive ? 'font-medium text-blue-500' : isPast ? 'text-gray-700' : 'text-gray-500'}
                    `} style={isActive ? { color: primaryColor } : {}}>
                      {Object.values(STEPS)[index].split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Current step content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          {renderStep()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} {tenant.businessName}. All rights reserved.</p>
          <p className="mt-1">Powered by Aesthenda</p>
        </div>
      </footer>
    </div>
  );
};

export default BookingPage; 