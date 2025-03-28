import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

const Header = ({ title }) => {
  const { logout, currentUser } = useAuth();
  const { currentTenant } = useTenant();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            {currentTenant && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800" 
                style={{ 
                  backgroundColor: `${currentTenant.settings.branding.primaryColor}20`,
                  color: currentTenant.settings.branding.primaryColor 
                }}
              >
                {currentTenant.businessName}
              </span>
            )}
            
            {/* Show stylist ID if available */}
            {currentUser && currentUser.stylist_id && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                ID: {currentUser.stylist_id}
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            {/* Notification bell */}
            <button className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </button>
            
            {/* User dropdown (simplified) */}
            <div className="ml-3 relative">
              <button
                onClick={handleLogout}
                className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 