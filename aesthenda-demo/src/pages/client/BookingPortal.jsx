import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_TENANT } from '../../graphql/queries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const BookingPortal = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Query to get tenant information for branding
  const { data: tenantData, loading: tenantLoading, error: tenantError } = useQuery(GET_TENANT, {
    variables: { id: tenantId },
    skip: !tenantId
  });

  // Set up loading state
  useEffect(() => {
    if (!tenantLoading && tenantData) {
      setLoading(false);
    }
    
    if (tenantError) {
      setError('Unable to load salon information. Please try again later.');
      setLoading(false);
    }
  }, [tenantLoading, tenantData, tenantError]);

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

  // Start the booking process
  const startBooking = () => {
    navigate(`/${tenantId}/booking/services`);
  };

  // Go to manage appointments page
  const goToManageAppointments = () => {
    navigate(`/${tenantId}/manage-appointments`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Tenant header with branding */}
      <header className="py-6 px-4 sm:px-6 bg-white shadow-sm" style={{ backgroundColor: `${primaryColor}10` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {tenant.settings?.branding?.logoUrl ? (
              <img 
                src={tenant.settings.branding.logoUrl} 
                alt={tenant.businessName} 
                className="h-10 w-auto"
              />
            ) : (
              <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
                {tenant.businessName}
              </h1>
            )}
          </div>
          <button
            onClick={goToManageAppointments}
            className="text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Manage My Appointments
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Book Your Appointment
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Schedule your visit with {tenant.businessName} in just a few simple steps.
          </p>
        </div>

        {/* Booking card */}
        <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to book your appointment?
            </h2>
            <p className="text-gray-600 mb-6">
              Our online booking system allows you to choose your preferred services, 
              select a time that works for you, and book with your favorite stylist.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}25` }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primaryColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Choose Your Services</h3>
                  <p className="text-sm text-gray-500">Select from our range of services</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}25` }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primaryColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Pick a Date & Time</h3>
                  <p className="text-sm text-gray-500">Choose from available appointment slots</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}25` }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: primaryColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Select Your Stylist</h3>
                  <p className="text-sm text-gray-500">Choose your preferred professional</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <button
                type="button"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor, boxShadow: `0 4px 6px ${primaryColor}25` }}
                onClick={startBooking}
              >
                Start Booking Now
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                onClick={goToManageAppointments}
              >
                Already have an appointment? View or reschedule it here
              </button>
            </div>
          </div>
        </div>

        {/* Business information */}
        <div className="mt-12 max-w-lg mx-auto">
          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-medium text-gray-900">About {tenant.businessName}</h3>
            <div className="mt-4 text-gray-600">
              <p>{tenant.description || 'We provide high-quality salon services tailored to your needs.'}</p>
              
              <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Location</h4>
                  <p className="mt-2 text-sm text-gray-500">
                    {tenant.address?.street}<br />
                    {tenant.address?.city}, {tenant.address?.state} {tenant.address?.zip}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Contact</h4>
                  <p className="mt-2 text-sm text-gray-500">
                    {tenant.phone || 'Phone not available'}<br />
                    {tenant.email || 'Email not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {tenant.businessName}. All rights reserved.</p>
          <p className="mt-2">Powered by Aesthenda</p>
        </div>
      </footer>
    </div>
  );
};

export default BookingPortal; 