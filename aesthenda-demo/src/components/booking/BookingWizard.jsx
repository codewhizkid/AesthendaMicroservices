import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import ServiceSelectionStep from './ServiceSelectionStep';
import DateTimeSelectionStep from './DateTimeSelectionStep';
import StylistSelectionStep from './StylistSelectionStep';
import CustomerInfoStep from './CustomerInfoStep';
import BookingPaymentStep from './BookingPaymentStep';
import BookingConfirmation from './BookingConfirmation';
import { appointmentService } from '../../api/appointmentService';
import { GET_TENANT } from '../../graphql/queries';

// Define the steps in the booking wizard
const STEPS = {
  SERVICES: 'services',
  DATETIME: 'datetime',
  STYLIST: 'stylist',
  CUSTOMER_INFO: 'customer_info',
  PAYMENT: 'payment',
  CONFIRMATION: 'confirmation'
};

const BookingWizard = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(STEPS.SERVICES);
  const [bookingData, setBookingData] = useState({
    services: [],
    date: '',
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
  const [appointmentId, setAppointmentId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Query to get tenant information
  const { data: tenantData, loading: tenantLoading, error: tenantError } = useQuery(GET_TENANT, {
    variables: { id: tenantId },
    skip: !tenantId
  });
  
  // Effect to reset appointment data if tenant changes
  useEffect(() => {
    if (tenantId) {
      setBookingData(prevData => ({
        ...prevData,
        services: [],
        stylistId: '',
        date: '',
        time: ''
      }));
      
      setCurrentStep(STEPS.SERVICES);
      setAppointmentId(null);
    }
  }, [tenantId]);
  
  // Update booking data when changes are made at any step
  const updateBookingData = (data) => {
    setBookingData(prevData => ({
      ...prevData,
      ...data
    }));
  };
  
  // Calculate total price when services change
  useEffect(() => {
    if (bookingData.services.length > 0) {
      const total = bookingData.services.reduce((sum, service) => sum + (service.price || 0), 0);
      updateBookingData({ totalPrice: total });
    } else {
      updateBookingData({ totalPrice: 0 });
    }
  }, [bookingData.services]);
  
  // Handle next button click
  const handleNext = async () => {
    try {
      // Validate before proceeding
      validateCurrentStep();
      
      // If moving from customer info to payment, create the appointment
      if (currentStep === STEPS.CUSTOMER_INFO) {
        await createAppointment();
      }
      
      // Determine the next step
      const nextStep = getNextStep();
      setCurrentStep(nextStep);
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Handle back button click
  const handleBack = () => {
    setError(null);
    const previousStep = getPreviousStep();
    setCurrentStep(previousStep);
  };
  
  // Validate the current step data before proceeding
  const validateCurrentStep = () => {
    switch (currentStep) {
      case STEPS.SERVICES:
        if (!bookingData.services.length) {
          throw new Error('Please select at least one service');
        }
        break;
        
      case STEPS.DATETIME:
        if (!bookingData.date || !bookingData.time) {
          throw new Error('Please select a date and time');
        }
        break;
        
      case STEPS.STYLIST:
        if (!bookingData.stylistId) {
          throw new Error('Please select a stylist');
        }
        break;
        
      case STEPS.CUSTOMER_INFO:
        // Validation will be handled in the CustomerInfoStep component
        break;
        
      default:
        break;
    }
  };
  
  // Get the next step in the wizard
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
  
  // Get the previous step in the wizard
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
  
  // Create the appointment in the backend
  const createAppointment = async () => {
    setLoading(true);
    
    try {
      // Format the appointment data
      const appointmentInput = {
        tenantId,
        services: bookingData.services.map(service => service.id),
        stylistId: bookingData.stylistId,
        date: bookingData.date,
        startTime: bookingData.time,
        customer: {
          firstName: bookingData.customer.firstName,
          lastName: bookingData.customer.lastName,
          email: bookingData.customer.email,
          phone: bookingData.customer.phone
        },
        notes: bookingData.notes,
        status: 'pending_payment'
      };
      
      // Call the API to create the appointment
      const response = await appointmentService.createAppointment(tenantId, appointmentInput);
      
      // Store the appointment ID for the payment step
      setAppointmentId(response.id);
      
      // Update booking data with the appointment ID
      updateBookingData({ id: response.id });
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(`Failed to create appointment: ${err.message}`);
      throw err;
    }
  };
  
  // Handle payment completion
  const handlePaymentComplete = async (paymentData) => {
    // Update the booking data with payment information
    updateBookingData({ payment: paymentData });
    
    // Update the appointment with payment info on the server
    if (appointmentId) {
      try {
        await appointmentService.updateAppointment(tenantId, appointmentId, {
          paymentStatus: paymentData.paymentStatus,
          paymentId: paymentData.paymentId
        });
      } catch (err) {
        console.error('Error updating appointment with payment info:', err);
        // Continue to confirmation even if this fails
      }
    }
    
    // Move to confirmation step
    setCurrentStep(STEPS.CONFIRMATION);
  };
  
  // Handle booking completion
  const handleBookingComplete = () => {
    navigate(`/${tenantId}/booking-success`, { 
      state: { 
        appointmentId,
        bookingData
      } 
    });
  };
  
  // Handle booking cancellation
  const handleCancel = () => {
    // If we've created an appointment but are cancelling, we should delete it
    if (appointmentId) {
      appointmentService.cancelAppointment(tenantId, appointmentId)
        .catch(err => console.error('Error cancelling appointment:', err));
    }
    
    navigate(`/${tenantId}`);
  };
  
  // Render loading state
  if (tenantLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }
  
  // Render error state
  if (tenantError) {
    return (
      <div className="p-8">
        <ErrorMessage message="Error loading salon information. Please try again later." />
      </div>
    );
  }
  
  const tenant = tenantData?.tenant;
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{tenant?.name || 'Book an Appointment'}</h1>
        <p className="text-gray-600 mt-2">{tenant?.description || 'Select your services and preferred time'}</p>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between">
          {Object.values(STEPS).map((step, index) => {
            // Don't show confirmation in progress bar
            if (step === STEPS.CONFIRMATION) return null;
            
            const isActive = currentStep === step;
            const isCompleted = 
              Object.values(STEPS).indexOf(currentStep) > 
              Object.values(STEPS).indexOf(step);
            
            return (
              <div 
                key={step} 
                className={`flex flex-col items-center ${index < Object.values(STEPS).length - 2 ? 'w-1/4' : ''}`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-primary-600 text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" fill="none" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-xs mt-1 text-gray-600">
                  {step.replace('_', ' ').charAt(0).toUpperCase() + step.replace('_', ' ').slice(1)}
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="relative mt-2">
          <div className="absolute inset-0 flex items-center">
            <div className="h-1 w-full bg-gray-200 rounded"></div>
          </div>
          <div 
            className="absolute inset-0 flex items-center" 
            style={{ 
              width: `${
                Math.min(
                  100, 
                  (Object.values(STEPS).indexOf(currentStep) / (Object.values(STEPS).length - 2)) * 100
                )
              }%` 
            }}
          >
            <div className="h-1 w-full bg-primary-600 rounded"></div>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}
      
      {/* Wizard Steps */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <LoadingSpinner size="medium" />
            <span className="ml-2">Processing...</span>
          </div>
        ) : (
          <>
            {currentStep === STEPS.SERVICES && (
              <ServiceSelectionStep 
                tenantId={tenantId}
                selectedServices={bookingData.services}
                onServicesChange={(services) => updateBookingData({ services })}
                onNext={handleNext}
                onCancel={handleCancel}
              />
            )}
            
            {currentStep === STEPS.DATETIME && (
              <DateTimeSelectionStep 
                tenantId={tenantId}
                selectedDate={bookingData.date}
                selectedTime={bookingData.time}
                onDateTimeChange={(dateTime) => updateBookingData(dateTime)}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            
            {currentStep === STEPS.STYLIST && (
              <StylistSelectionStep 
                tenantId={tenantId}
                selectedServices={bookingData.services}
                selectedDate={bookingData.date}
                selectedTime={bookingData.time}
                selectedStylist={bookingData.stylistId}
                onStylistChange={(stylist) => updateBookingData({ 
                  stylistId: stylist.id,
                  stylistName: `${stylist.firstName} ${stylist.lastName}`
                })}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            
            {currentStep === STEPS.CUSTOMER_INFO && (
              <CustomerInfoStep 
                customerInfo={bookingData.customer}
                notes={bookingData.notes}
                onCustomerInfoChange={(customer) => updateBookingData({ customer })}
                onNotesChange={(notes) => updateBookingData({ notes })}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            
            {currentStep === STEPS.PAYMENT && (
              <BookingPaymentStep 
                appointmentData={bookingData}
                onComplete={handlePaymentComplete}
                onBack={handleBack}
                onError={(err) => setError(err.message)}
              />
            )}
            
            {currentStep === STEPS.CONFIRMATION && (
              <BookingConfirmation 
                bookingData={bookingData}
                tenantName={tenant?.name}
                onComplete={handleBookingComplete}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingWizard; 