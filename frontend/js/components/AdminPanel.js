import React, { useState } from 'react';
import { AdminProvider } from '../context/AdminContext';
import SalonProfileTab from './admin/SalonProfileTab';
import ServiceCatalogTab from './admin/ServiceCatalogTab';
import RolesPermissionsTab from './admin/RolesPermissionsTab';
import StaffManagementTab from './admin/StaffManagementTab';
import PaymentSettingsTab from './admin/PaymentSettingsTab';
import AlertContainer from './common/AlertContainer';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('salon-profile');

  // Authentication check
  const checkAuth = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      window.location.href = '/login?redirect=/admin';
      return false;
    }
    return true;
  };
  
  if (!checkAuth()) {
    return null; // Don't render anything if not authenticated
  }

  const tabClass = (tabId) => 
    `px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === tabId 
      ? 'bg-white text-primary-600 border-b-2 border-primary-500' 
      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`;

  return (
    <AdminProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-primary-600">Aesthenda Admin</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-2 px-4 pt-4">
                <button 
                  className={tabClass('salon-profile')} 
                  onClick={() => setActiveTab('salon-profile')}
                >
                  Salon Profile
                </button>
                <button 
                  className={tabClass('service-catalog')} 
                  onClick={() => setActiveTab('service-catalog')}
                >
                  Service Catalog
                </button>
                <button 
                  className={tabClass('roles-permissions')} 
                  onClick={() => setActiveTab('roles-permissions')}
                >
                  Roles & Permissions
                </button>
                <button 
                  className={tabClass('staff-management')} 
                  onClick={() => setActiveTab('staff-management')}
                >
                  Staff Management
                </button>
                <button 
                  className={tabClass('payment-settings')} 
                  onClick={() => setActiveTab('payment-settings')}
                >
                  Payment Settings
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {activeTab === 'salon-profile' && <SalonProfileTab />}
              {activeTab === 'service-catalog' && <ServiceCatalogTab />}
              {activeTab === 'roles-permissions' && <RolesPermissionsTab />}
              {activeTab === 'staff-management' && <StaffManagementTab />}
              {activeTab === 'payment-settings' && <PaymentSettingsTab />}
            </div>
          </div>
        </main>
        
        {/* Alert container */}
        <AlertContainer />
      </div>
    </AdminProvider>
  );
};

export default AdminPanel;
