import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../../context/AdminContext';
import { useForm } from '../../utils/uiUtils';

const SalonProfileTab = () => {
  const { state, actions, showAlert } = useAdminContext();
  const { salon, isLoading } = state;

  // Form for salon information
  const { values: salonInfo, handleChange: handleSalonInfoChange, setValues: setSalonInfo } = useForm({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    website: ''
  });

  // State for business hours
  const [businessHours, setBusinessHours] = useState({
    monday: { isOpen: true, open: '09:00', close: '18:00' },
    tuesday: { isOpen: true, open: '09:00', close: '18:00' },
    wednesday: { isOpen: true, open: '09:00', close: '18:00' },
    thursday: { isOpen: true, open: '09:00', close: '18:00' },
    friday: { isOpen: true, open: '09:00', close: '18:00' },
    saturday: { isOpen: true, open: '10:00', close: '16:00' },
    sunday: { isOpen: false, open: '10:00', close: '16:00' }
  });

  // State for branding settings
  const [branding, setBranding] = useState({
    primaryColor: '#6B705C',
    secondaryColor: '#E6DACE',
    accentColor: '#B78A67',
    logoUrl: '',
    fontFamily: 'Montserrat'
  });

  // State for save button
  const [isSaving, setIsSaving] = useState(false);

  // Fetch salon profile on component mount
  useEffect(() => {
    loadSalonProfile();
  }, []);

  // Load salon profile data
  const loadSalonProfile = async () => {
    try {
      const data = await actions.loadSalonProfile();
      
      // Update local state with fetched data
      if (data.salonInfo) {
        setSalonInfo(data.salonInfo);
      }
      
      if (data.businessHours) {
        setBusinessHours(data.businessHours);
      }
      
      if (data.branding) {
        setBranding(data.branding);
      }
    } catch (error) {
      console.error('Error in loadSalonProfile:', error);
    }
  };

  // Handle business hours change
  const handleBusinessHoursChange = (day, field, value) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  // Handle branding change
  const handleBrandingChange = (e) => {
    const { name, value } = e.target;
    setBranding(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Logo image must be less than 2MB', 'error');
      return;
    }
    
    // Check file type
    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      showAlert('Logo must be JPG, PNG, or SVG format', 'error');
      return;
    }
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('logo', file);
      
      // Upload logo
      // This would usually be a separate API call, but for now we'll
      // mock it by setting a temporary URL
      const logoUrl = URL.createObjectURL(file);
      
      // Update branding with new logo URL
      setBranding(prev => ({
        ...prev,
        logoUrl
      }));
      
      showAlert('Logo uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showAlert(`Error uploading logo: ${error.message}`, 'error');
    }
  };

  // Save salon profile
  const saveSalonProfile = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Combine all salon data
      const profileData = {
        salonInfo,
        businessHours,
        branding
      };
      
      // Save through context action
      await actions.updateSalonProfile(profileData);
    } catch (error) {
      console.error('Error saving salon profile:', error);
      // The error will be handled by the action itself, showing an alert
    } finally {
      setIsSaving(false);
    }
  };

  // Color preview component
  const ColorPreview = ({ color }) => (
    <div 
      className="h-6 w-6 rounded-full inline-block border border-gray-300"
      style={{ backgroundColor: color }}
    />
  );

  // Days of the week array for business hours
  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-primary-800">Salon Profile Management</h2>
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-primary-800">Salon Profile Management</h2>
      <p className="text-gray-600">Configure your salon's information, branding, and business hours.</p>
      
      <form onSubmit={saveSalonProfile}>
        {/* Salon Information Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium text-primary-800 mb-4">Salon Information</h3>
          <p className="text-sm text-gray-600 mb-6">Update your salon's basic information and contact details.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salon Name</label>
              <input 
                type="text" 
                name="businessName"
                value={salonInfo.businessName}
                onChange={handleSalonInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter salon name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input 
                type="email" 
                name="email"
                value={salonInfo.email}
                onChange={handleSalonInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="contact@yoursalon.com"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                value={salonInfo.phone}
                onChange={handleSalonInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="(XXX) XXX-XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input 
                type="url" 
                name="website"
                value={salonInfo.website}
                onChange={handleSalonInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://yoursalon.com"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input 
              type="text" 
              name="address"
              value={salonInfo.address}
              onChange={handleSalonInfoChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="123 Main St"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input 
                type="text" 
                name="city"
                value={salonInfo.city}
                onChange={handleSalonInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input 
                type="text" 
                name="state"
                value={salonInfo.state}
                onChange={handleSalonInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input 
                type="text" 
                name="zipCode"
                value={salonInfo.zipCode}
                onChange={handleSalonInfoChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ZIP Code"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salon Description</label>
            <textarea 
              name="description"
              value={salonInfo.description}
              onChange={handleSalonInfoChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief description of your salon and services"
              rows="3"
            />
          </div>
        </div>
        
        {/* Business Hours Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium text-primary-800 mb-4">Business Hours</h3>
          <p className="text-sm text-gray-600 mb-6">Set your regular business hours and special closures.</p>
          
          <div className="space-y-4">
            {daysOfWeek.map(day => (
              <div key={day.key} className="flex items-center space-x-4">
                <div className="w-32">
                  <label className="font-medium text-gray-700">{day.label}</label>
                </div>
                
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id={`isOpen-${day.key}`}
                    checked={businessHours[day.key].isOpen}
                    onChange={(e) => handleBusinessHoursChange(day.key, 'isOpen', e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500 mr-2"
                  />
                  <label htmlFor={`isOpen-${day.key}`} className="text-sm text-gray-600">
                    Open
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    type="time" 
                    value={businessHours[day.key].open}
                    onChange={(e) => handleBusinessHoursChange(day.key, 'open', e.target.value)}
                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={!businessHours[day.key].isOpen}
                  />
                  <span>to</span>
                  <input 
                    type="time" 
                    value={businessHours[day.key].close}
                    onChange={(e) => handleBusinessHoursChange(day.key, 'close', e.target.value)}
                    className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={!businessHours[day.key].isOpen}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Branding Settings Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium text-primary-800 mb-4">Branding Settings</h3>
          <p className="text-sm text-gray-600 mb-6">Customize the look and feel of your client-facing booking page.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Salon Logo</label>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 border border-gray-200 rounded-md flex items-center justify-center overflow-hidden bg-white">
                    {branding.logoUrl ? (
                      <img 
                        src={branding.logoUrl} 
                        alt="Salon Logo" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs text-center px-2">No logo uploaded</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input 
                      type="file" 
                      id="logo-upload"
                      onChange={handleLogoUpload}
                      className="hidden"
                      accept="image/jpeg, image/png, image/svg+xml"
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="inline-block px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Upload Logo
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended size: 200x200px. JPG, PNG, or SVG. Max 2MB.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Font</label>
                <select
                  name="fontFamily"
                  value={branding.fontFamily}
                  onChange={handleBrandingChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="Montserrat">Montserrat</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Lato">Lato</option>
                  <option value="Playfair Display">Playfair Display</option>
                </select>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color <ColorPreview color={branding.primaryColor} />
                </label>
                <input 
                  type="color" 
                  name="primaryColor"
                  value={branding.primaryColor}
                  onChange={handleBrandingChange}
                  className="w-full p-1 border border-gray-300 rounded-md h-10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Primary buttons and accents
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Color <ColorPreview color={branding.secondaryColor} />
                </label>
                <input 
                  type="color" 
                  name="secondaryColor"
                  value={branding.secondaryColor}
                  onChange={handleBrandingChange}
                  className="w-full p-1 border border-gray-300 rounded-md h-10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Backgrounds and secondary elements
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accent Color <ColorPreview color={branding.accentColor} />
                </label>
                <input 
                  type="color" 
                  name="accentColor"
                  value={branding.accentColor}
                  onChange={handleBrandingChange}
                  className="w-full p-1 border border-gray-300 rounded-md h-10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Highlights and important elements
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">Preview</h4>
            <div 
              className="p-4 rounded-md shadow-sm"
              style={{ 
                backgroundColor: branding.secondaryColor,
                fontFamily: branding.fontFamily
              }}
            >
              <div className="flex items-center mb-4">
                {branding.logoUrl && (
                  <img 
                    src={branding.logoUrl} 
                    alt="Logo Preview" 
                    className="h-10 mr-2"
                  />
                )}
                <h3 className="font-bold" style={{ color: branding.primaryColor }}>
                  {salonInfo.businessName || 'Your Salon Name'}
                </h3>
              </div>
              <div className="flex space-x-2 mb-4">
                <button 
                  className="px-4 py-2 rounded-md text-white text-sm"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Primary Button
                </button>
                <button 
                  className="px-4 py-2 rounded-md text-sm"
                  style={{ 
                    backgroundColor: 'white',
                    color: branding.accentColor,
                    border: `1px solid ${branding.accentColor}`
                  }}
                >
                  Secondary Button
                </button>
              </div>
              <div 
                className="p-2 text-sm rounded-md"
                style={{ 
                  border: `1px solid ${branding.accentColor}`,
                  backgroundColor: 'white' 
                }}
              >
                <p>Sample content with <span style={{ color: branding.accentColor }}>accent</span> colors</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SalonProfileTab; 