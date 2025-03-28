import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../../context/AdminContext';
import { LoadingSpinner, EmptyState, useConfirmDialog } from '../../utils/uiUtils';

const StaffManagementTab = () => {
  const { state, actions, showAlert } = useAdminContext();
  const { staff, roles, isLoading } = state;
  const { openConfirmDialog, ConfirmDialog } = useConfirmDialog();

  // Load staff and roles on component mount
  useEffect(() => {
    actions.loadStaff();
    actions.loadRoles();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-primary-800">Staff Management</h2>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-primary-800">Staff Management</h2>
      <p className="text-gray-600">Add, edit, and manage your salon staff members.</p>
      
      {/* Staff Directory - To be implemented */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-primary-800 mb-4">Staff Directory</h3>
        <p className="text-gray-600 mb-6">View and manage all staff members.</p>
        
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">Staff directory will be implemented in the next phase.</p>
        </div>
      </div>
      
      {/* Add New Staff Member - To be implemented */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-primary-800 mb-4">Add New Staff Member</h3>
        <p className="text-gray-600 mb-6">Create a new staff profile and assign roles.</p>
        
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">Add staff functionality will be implemented in the next phase.</p>
        </div>
      </div>
      
      {/* Staff Role Assignment - To be implemented */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-primary-800 mb-4">Role Assignments</h3>
        <p className="text-gray-600 mb-6">Assign and manage roles for your staff members.</p>
        
        <div className="text-center p-8 bg-gray-50 rounded-md">
          <p className="text-gray-500">Role assignment functionality will be implemented in the next phase.</p>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  );
};

export default StaffManagementTab; 