import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../../context/AdminContext';
import { LoadingSpinner, EmptyState, useConfirmDialog } from '../../utils/uiUtils';

const ServiceCatalogTab = () => {
  const { state, actions, showAlert } = useAdminContext();
  const { services, serviceCategories, isLoading } = state;
  const { openConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Load services and categories on component mount
  useEffect(() => {
    actions.loadServices();
    actions.loadServiceCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-primary-800">Service Catalog Management</h2>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-primary-800">Service Catalog Management</h2>
      <p className="text-gray-600">Add, edit, or remove services and update pricing and categories.</p>
      
      {/* Service Categories - To be implemented */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-primary-800 mb-4">Service Categories</h3>
        <p className="text-gray-600 mb-6">Create and manage service categories to organize your offerings.</p>
        
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">Service categories management will be implemented in the next phase.</p>
        </div>
      </div>
      
      {/* Services Management - To be implemented */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-primary-800 mb-4">Services</h3>
        <p className="text-gray-600 mb-6">Manage your salon's service offerings, pricing, and durations.</p>
        
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">Services management will be implemented in the next phase.</p>
        </div>
      </div>
      
      {/* Bulk Operations - To be implemented */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-primary-800 mb-4">Bulk Price Updates</h3>
        <p className="text-gray-600 mb-6">Update multiple service prices at once.</p>
        
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">Bulk price update functionality will be implemented in the next phase.</p>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  );
};

export default ServiceCatalogTab; 