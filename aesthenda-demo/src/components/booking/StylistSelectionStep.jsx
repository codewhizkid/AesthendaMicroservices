import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { GET_AVAILABLE_STYLISTS } from '../../graphql/queries';

const StylistSelectionStep = ({ 
  tenantId, 
  selectedServices, 
  selectedDate, 
  selectedTime, 
  selectedStylistId,
  onStylistSelect,
  onNext, 
  onBack 
}) => {
  const [error, setError] = useState(null);
  const [stylists, setStylists] = useState([]);
  
  // Format a date to YYYY-MM-DD string for API
  const formatDateForApi = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Query for available stylists based on selected date, time, and services
  const { loading, error: queryError, data } = useQuery(GET_AVAILABLE_STYLISTS, {
    variables: {
      tenantId,
      date: selectedDate ? formatDateForApi(selectedDate) : '',
      time: selectedTime || '',
      serviceIds: selectedServices?.map(service => service.id) || []
    },
    skip: !tenantId || !selectedDate || !selectedTime || selectedServices?.length === 0
  });
  
  // Update stylists list when data changes
  useEffect(() => {
    if (data?.availableStylists) {
      setStylists(data.availableStylists);
    }
    
    if (queryError) {
      setError('Failed to load available stylists. Please try again later.');
    }
  }, [data, queryError]);
  
  // Handle stylist selection
  const handleStylistSelect = (stylist) => {
    onStylistSelect({
      stylistId: stylist.id,
      stylistName: `${stylist.firstName} ${stylist.lastName}`
    });
  };
  
  // Validate before proceeding to next step
  const handleContinue = () => {
    if (!selectedStylistId) {
      setError('Please select a stylist to continue.');
      return;
    }
    
    onNext();
  };
  
  // Helper to generate star rating display
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-gradient">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#D1D5DB" />
            </linearGradient>
          </defs>
          <path fill="url(#half-gradient)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    // Add empty stars
    const emptyStarsCount = 5 - stars.length;
    for (let i = 0; i < emptyStarsCount; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="h-4 w-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    
    return (
      <div className="flex">
        {stars}
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Select Your Stylist</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose the stylist you'd like for your appointment
          </p>
        </div>
        
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }
  
  // Render the list of available stylists
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Select Your Stylist</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose the stylist you'd like for your appointment
        </p>
      </div>
      
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}
      
      {/* Appointment details summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-base font-medium text-gray-900 mb-2">Your Appointment Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Date:</p>
            <p className="text-sm font-medium text-gray-900">
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Time:</p>
            <p className="text-sm font-medium text-gray-900">
              {selectedTime ? 
                new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) 
                : ''}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-sm text-gray-500">Services:</p>
            <ul className="mt-1 space-y-1">
              {selectedServices?.map(service => (
                <li key={service.id} className="text-sm font-medium text-gray-900">
                  {service.name} (${parseFloat(service.price).toFixed(2)})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {stylists.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No stylists available</h3>
          <p className="mt-1 text-sm text-gray-500">
            No stylists are available for your selected services, date, and time.
            <br />Please try a different time or date.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onBack}
            >
              Go Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {stylists.map(stylist => (
            <div 
              key={stylist.id}
              className={`
                bg-white rounded-lg shadow-sm border p-4 sm:p-6
                transition-all cursor-pointer
                ${selectedStylistId === stylist.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}
              `}
              onClick={() => handleStylistSelect(stylist)}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Stylist image */}
                <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                  {stylist.profileImage ? (
                    <img 
                      src={stylist.profileImage} 
                      alt={`${stylist.firstName} ${stylist.lastName}`}
                      className="h-24 w-24 rounded-full object-cover mx-auto sm:mx-0"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto sm:mx-0">
                      <span className="text-xl font-medium text-gray-500">
                        {stylist.firstName.charAt(0)}{stylist.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Stylist info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {stylist.firstName} {stylist.lastName}
                      </h3>
                      
                      {/* Specialties */}
                      {stylist.specialties && stylist.specialties.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {stylist.specialties.map((specialty, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Rating */}
                    {stylist.rating && (
                      <div className="mt-2 sm:mt-0 flex items-center">
                        {renderStars(stylist.rating)}
                        <span className="ml-1 text-sm text-gray-500">
                          ({stylist.reviews?.length || 0})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Bio */}
                  {stylist.bio && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                      {stylist.bio}
                    </p>
                  )}
                </div>
                
                {/* Selection indicator */}
                {selectedStylistId === stylist.id && (
                  <div className="absolute top-4 right-4">
                    <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className={`
            py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${selectedStylistId
              ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
          onClick={handleContinue}
          disabled={!selectedStylistId}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StylistSelectionStep; 