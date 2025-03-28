import React from 'react';
import { useTenant } from '../context/TenantContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';

// Staff card component
const StaffCard = ({ staff }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Staff header with avatar */}
      <div className="p-4 border-b border-gray-100 flex items-center">
        <img
          src={staff.profile.avatar}
          alt={`${staff.firstName} ${staff.lastName}`}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div className="ml-4">
          <h3 className="font-medium text-gray-900">{staff.firstName} {staff.lastName}</h3>
          <p className="text-sm text-gray-500 capitalize">{staff.profile.title}</p>
        </div>
      </div>
      
      {/* Staff details */}
      <div className="p-4">
        <div className="mb-3">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Email:</span> {staff.email}
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">ID:</span> {staff.stylist_id}
          </p>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Role:</span> {staff.role.replace('_', ' ')}
          </p>
        </div>
        
        {staff.profile.bio && (
          <p className="text-sm text-gray-600 mt-2">
            {staff.profile.bio}
          </p>
        )}
        
        {/* Services offered */}
        {staff.profile.services && staff.profile.services.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-700 mb-1">Services:</p>
            <div className="flex flex-wrap gap-1">
              {staff.profile.services.map(service => (
                <span 
                  key={service} 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 text-right">
        <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
          Edit
        </button>
        <button className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none">
          Delete
        </button>
      </div>
    </div>
  );
};

// Staff Management Page
const StaffManagement = () => {
  const { tenantData, currentTenant, loading } = useTenant();
  const staffList = tenantData?.staff || [];
  
  return (
    <DashboardLayout title="Staff Management">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Staff Members
            </h2>
            <p className="text-sm text-gray-600">
              Manage staff for {currentTenant?.businessName || 'your salon'}
            </p>
          </div>
          <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
            Add Staff Member
          </button>
        </div>
      </div>
      
      {/* Tenant ID note - demonstrating tenant isolation */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Multi-tenant isolation:</strong> You're viewing staff for tenant ID <strong>{currentTenant?.tenantId}</strong>. 
              Each salon only has access to their own staff.
            </p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : staffList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map(staff => (
            <StaffCard key={staff.id} staff={staff} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No staff members</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first staff member.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StaffManagement; 