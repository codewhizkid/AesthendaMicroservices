import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';

// Color palette component for branding
const ColorPalette = ({ primaryColor, secondaryColor }) => {
  return (
    <div className="flex space-x-3 mt-2">
      <div 
        className="w-10 h-10 rounded-full shadow-sm border border-gray-200" 
        style={{ backgroundColor: primaryColor }}
        title="Primary color"
      />
      <div 
        className="w-10 h-10 rounded-full shadow-sm border border-gray-200" 
        style={{ backgroundColor: secondaryColor }}
        title="Secondary color"
      />
      <div 
        className="w-10 h-10 rounded-full shadow-sm border border-gray-200" 
        style={{ backgroundColor: '#ffffff' }}
        title="Background color"
      />
      <div 
        className="w-10 h-10 rounded-full shadow-sm border border-gray-200" 
        style={{ backgroundColor: '#000000' }}
        title="Text color"
      />
    </div>
  );
};

// Business hours display component
const BusinessHoursDisplay = ({ businessHours }) => {
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return (
    <div className="mt-4 space-y-2">
      {daysOfWeek.map(day => {
        const hours = businessHours[day];
        
        return (
          <div key={day} className="grid grid-cols-3 text-sm">
            <div className="font-medium capitalize">{day}</div>
            {hours.isOpen ? (
              <div className="col-span-2">{hours.open} - {hours.close}</div>
            ) : (
              <div className="col-span-2 text-gray-500">Closed</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Main Settings Page
const SalonSettings = () => {
  const { currentTenant, loading } = useTenant();
  const [activeTab, setActiveTab] = useState('general');
  
  const tabs = [
    { id: 'general', name: 'General' },
    { id: 'branding', name: 'Branding' },
    { id: 'hours', name: 'Business Hours' },
    { id: 'booking', name: 'Booking Page' },
  ];
  
  // For demo purposes - not actually saving changes
  const handleSaveChanges = () => {
    alert('In a real app, this would save your changes to the server.');
  };
  
  return (
    <DashboardLayout title="Salon Settings">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Salon Configuration
        </h2>
        <p className="text-sm text-gray-600">
          Manage settings for {currentTenant?.businessName || 'your salon'}
        </p>
      </div>
      
      {/* Tenant ID note - demonstrating tenant isolation */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Multi-tenant branding:</strong> Any changes you make here only affect <strong>{currentTenant?.businessName}</strong> (tenant ID: {currentTenant?.tenantId}). 
              Each salon has its own branding and settings.
            </p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : currentTenant ? (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="px-6 flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? `border-blue-500 text-blue-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  style={
                    activeTab === tab.id 
                      ? { borderColor: currentTenant.settings.branding.primaryColor, color: currentTenant.settings.branding.primaryColor } 
                      : {}
                  }
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">General Information</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Basic information about your salon.
                </p>
                
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="business-name" className="block text-sm font-medium text-gray-700">
                      Business Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="business-name"
                        id="business-name"
                        defaultValue={currentTenant.businessName}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        defaultValue={currentTenant.contactInfo.phone}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        defaultValue={currentTenant.contactInfo.email}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-4">
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="website"
                        id="website"
                        defaultValue={currentTenant.contactInfo.website}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'branding' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Branding</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Customize the look and feel of your salon's presence.
                </p>
                
                <div className="mt-6">
                  <div className="mb-6">
                    <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
                      Logo
                    </label>
                    <div className="mt-2 flex items-center">
                      <img 
                        src={currentTenant.settings.branding.logoUrl} 
                        alt={currentTenant.businessName}
                        className="h-12 w-auto"
                      />
                      <button type="button" className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                        Change
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700">
                        Primary Color
                      </label>
                      <div className="mt-1 flex items-center">
                        <input
                          type="text"
                          name="primary-color"
                          id="primary-color"
                          defaultValue={currentTenant.settings.branding.primaryColor}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        <div 
                          className="ml-2 h-6 w-6 rounded border border-gray-300" 
                          style={{ backgroundColor: currentTenant.settings.branding.primaryColor }}
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="secondary-color" className="block text-sm font-medium text-gray-700">
                        Secondary Color
                      </label>
                      <div className="mt-1 flex items-center">
                        <input
                          type="text"
                          name="secondary-color"
                          id="secondary-color"
                          defaultValue={currentTenant.settings.branding.secondaryColor}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        <div 
                          className="ml-2 h-6 w-6 rounded border border-gray-300" 
                          style={{ backgroundColor: currentTenant.settings.branding.secondaryColor }}
                        />
                      </div>
                    </div>
                    
                    <div className="sm:col-span-4">
                      <label htmlFor="font-family" className="block text-sm font-medium text-gray-700">
                        Font Family
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="font-family"
                          id="font-family"
                          defaultValue={currentTenant.settings.branding.fontFamily}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700">Color Palette Preview</h4>
                    <ColorPalette 
                      primaryColor={currentTenant.settings.branding.primaryColor} 
                      secondaryColor={currentTenant.settings.branding.secondaryColor} 
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'hours' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Business Hours</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Set your salon's regular business hours.
                </p>
                
                <BusinessHoursDisplay businessHours={currentTenant.businessHours} />
                
                <div className="mt-6">
                  <button type="button" className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                    Edit Hours
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'booking' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Booking Page</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Configure your client-facing booking page.
                </p>
                
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="welcome-message" className="block text-sm font-medium text-gray-700">
                      Welcome Message
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="welcome-message"
                        name="welcome-message"
                        rows={3}
                        defaultValue={currentTenant.settings.bookingPage.welcomeMessage}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      This message will be displayed at the top of your booking page.
                    </p>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <div className="flex items-center">
                      <input
                        id="show-prices"
                        name="show-prices"
                        type="checkbox"
                        defaultChecked={currentTenant.settings.bookingPage.displayOptions.showPrices}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="show-prices" className="ml-2 block text-sm text-gray-700">
                        Show prices on booking page
                      </label>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <div className="flex items-center">
                      <input
                        id="show-duration"
                        name="show-duration"
                        type="checkbox"
                        defaultChecked={currentTenant.settings.bookingPage.displayOptions.showDuration}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="show-duration" className="ml-2 block text-sm text-gray-700">
                        Show service duration on booking page
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700">Public booking URL</h4>
                  <div className="mt-2 flex items-center">
                    <span className="text-gray-500">https://aesthenda.com/book/</span>
                    <span className="font-medium">{currentTenant.slug}</span>
                    <button 
                      type="button"
                      className="ml-2 inline-flex items-center px-2 py-1 border border-gray-300 text-xs leading-4 font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://aesthenda.com/book/${currentTenant.slug}`);
                        alert('URL copied to clipboard!');
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button 
              type="button" 
              className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleSaveChanges}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              style={{ backgroundColor: currentTenant.settings.branding.primaryColor }}
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <p className="text-gray-500">
            No tenant information found.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SalonSettings; 