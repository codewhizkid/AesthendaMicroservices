import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

// GraphQL query to get services for a tenant
const GET_SERVICES = gql`
  query GetServices($tenantId: ID!) {
    services(tenantId: $tenantId) {
      id
      name
      description
      price
      duration
      categoryId
      category {
        id
        name
      }
      imageUrl
    }
  }
`;

const ServiceSelectionStep = ({ tenantId, selectedServices, onServicesChange, onNext, onBack }) => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState(
    selectedServices ? selectedServices.map(service => service.id) : []
  );

  // Fetch services for the tenant
  const { data, loading: queryLoading, error: queryError } = useQuery(GET_SERVICES, {
    variables: { tenantId },
    skip: !tenantId
  });

  // Process services data when it's loaded
  useEffect(() => {
    if (data && data.services) {
      setServices(data.services);
      
      // Extract unique categories
      const uniqueCategories = [];
      const categoryMap = {};
      
      data.services.forEach(service => {
        if (service.category && !categoryMap[service.category.id]) {
          categoryMap[service.category.id] = true;
          uniqueCategories.push(service.category);
        }
      });
      
      setCategories(uniqueCategories);
      setLoading(false);
    }
    
    if (queryError) {
      setError('Failed to load services. Please try again later.');
      setLoading(false);
    }
  }, [data, queryError]);

  // Update loading state
  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading]);

  // Handle service selection/deselection
  const toggleService = (service) => {
    let updatedSelectedIds;
    let updatedSelectedServices;
    
    if (selectedServiceIds.includes(service.id)) {
      // Remove service if already selected
      updatedSelectedIds = selectedServiceIds.filter(id => id !== service.id);
      updatedSelectedServices = selectedServices.filter(s => s.id !== service.id);
    } else {
      // Add service if not selected
      updatedSelectedIds = [...selectedServiceIds, service.id];
      updatedSelectedServices = [...(selectedServices || []), service];
    }
    
    setSelectedServiceIds(updatedSelectedIds);
    onServicesChange(updatedSelectedServices);
  };

  // Format price as currency
  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Handle continue button click
  const handleContinue = () => {
    if (selectedServiceIds.length === 0) {
      setError('Please select at least one service to continue.');
      return;
    }
    
    onNext();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="my-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  // Services grouped by category
  const renderServicesByCategory = () => {
    // If we have categories, group services by category
    if (categories.length > 0) {
      return categories.map(category => (
        <div key={category.id} className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{category.name}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services
              .filter(service => service.category?.id === category.id)
              .map(service => renderServiceCard(service))}
          </div>
        </div>
      ));
    }
    
    // If no categories, just show all services
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {services.map(service => renderServiceCard(service))}
      </div>
    );
  };

  // Individual service card
  const renderServiceCard = (service) => {
    const isSelected = selectedServiceIds.includes(service.id);
    
    return (
      <div 
        key={service.id}
        className={`
          border rounded-lg p-4 cursor-pointer transition-all
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}
        `}
        onClick={() => toggleService(service)}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-base font-medium text-gray-900">{service.name}</h4>
            {service.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{service.description}</p>
            )}
          </div>
          
          {isSelected && (
            <div className="ml-2 flex-shrink-0 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="mt-2 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">{formatPrice(service.price)}</span>
          <span className="text-xs text-gray-500">{service.duration} min</span>
        </div>
      </div>
    );
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Select Services</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose the services you'd like to book. You can select multiple services.
        </p>
      </div>
      
      {/* Service selection */}
      <div className="mb-8">
        {renderServicesByCategory()}
      </div>
      
      {/* Selected services summary */}
      {selectedServiceIds.length > 0 && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-base font-medium text-gray-900 mb-2">Selected Services</h3>
          <ul className="space-y-2">
            {selectedServices.map(service => (
              <li key={service.id} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{service.name}</span>
                <span className="text-sm font-medium text-gray-900">{formatPrice(service.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-base font-medium text-gray-900">
              {formatPrice(selectedServices.reduce((sum, service) => sum + parseFloat(service.price), 0))}
            </span>
          </div>
        </div>
      )}
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
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
            ${selectedServiceIds.length > 0 
              ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
          onClick={handleContinue}
          disabled={selectedServiceIds.length === 0}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default ServiceSelectionStep; 