import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Onboarding = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    salonName: '',
    salonType: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    website: '',
    instagram: '',
    about: ''
  });
  const [errors, setErrors] = useState({});

  // Total number of steps in the onboarding process
  const totalSteps = 1; // Will increase as we add more steps

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  // Validate the current step's form fields
  const validateStep = () => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.salonName.trim()) {
        newErrors.salonName = 'Salon name is required';
      }
      
      if (!formData.salonType) {
        newErrors.salonType = 'Please select a salon type';
      }
      
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
      
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
      
      if (!formData.state.trim()) {
        newErrors.state = 'State is required';
      }
      
      if (!formData.zipCode.trim()) {
        newErrors.zipCode = 'Zip code is required';
      } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
        newErrors.zipCode = 'Invalid zip code format';
      }
      
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Invalid format. Use (123) 456-7890';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step button click
  const handleNextStep = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        // Submit the final form data
        handleSubmit();
      }
    }
  };

  // Handle form submission (completing all steps)
  const handleSubmit = async () => {
    try {
      // In a real app, this would send the data to the server
      // Simulate API call with setTimeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store salon info in localStorage for now
      localStorage.setItem('salon_profile', JSON.stringify(formData));
      
      // Navigate to dashboard after completing onboarding
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving salon profile:', error);
      setErrors({
        submit: 'There was an error saving your profile. Please try again.'
      });
    }
  };

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Strip all non-numeric characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  // Handle phone number input
  const handlePhoneChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setFormData({
      ...formData,
      phoneNumber: formattedNumber
    });
    
    if (errors.phoneNumber) {
      setErrors({
        ...errors,
        phoneNumber: undefined
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="bg-[#A9A29A] py-6 px-6 text-center">
          <h1 className="font-serif text-2xl uppercase tracking-wider text-white">Set Up Your Salon</h1>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2">
          <div 
            className="bg-[#C0A371] h-2 transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        
        <div className="p-6 md:p-8">
          {/* Step 1: Salon Profile */}
          {currentStep === 1 && (
            <div>
              <h2 className="font-serif text-xl mb-6">Salon Profile</h2>
              <p className="text-gray-600 mb-8">
                Let's get started by setting up your salon profile. This information will be displayed to your clients.
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salon Name*
                  </label>
                  <input
                    type="text"
                    name="salonName"
                    value={formData.salonName}
                    onChange={handleChange}
                    className={`w-full p-2 border ${errors.salonName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.salonName && (
                    <p className="text-red-500 text-xs mt-1">{errors.salonName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salon Type*
                  </label>
                  <select
                    name="salonType"
                    value={formData.salonType}
                    onChange={handleChange}
                    className={`w-full p-2 border ${errors.salonType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select salon type</option>
                    <option value="HairSalon">Hair Salon</option>
                    <option value="NailSalon">Nail Salon</option>
                    <option value="SpaSalon">Spa & Wellness</option>
                    <option value="BarberShop">Barber Shop</option>
                    <option value="BeautySalon">Beauty Salon</option>
                    <option value="MedSpa">Med Spa</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.salonType && (
                    <p className="text-red-500 text-xs mt-1">{errors.salonType}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address*
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full p-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City*
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full p-2 border ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State*
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`w-full p-2 border ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code*
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className={`w-full p-2 border ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.zipCode && (
                      <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number*
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="(123) 456-7890"
                      className={`w-full p-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.phoneNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://www.yoursalon.com"
                      className="w-full p-2 border border-gray-300"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram (Optional)
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      @
                    </span>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="yoursalonhandle"
                      className="flex-1 p-2 border border-gray-300"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    About Your Salon (Optional)
                  </label>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell clients about your salon, your specialties, or your approach to beauty and service."
                    className="w-full p-2 border border-gray-300"
                  ></textarea>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="mt-10 flex justify-end">
            <button
              onClick={handleNextStep}
              className="bg-[#C0A371] hover:bg-[#b0946a] text-white py-3 px-8 uppercase tracking-widest transition-colors"
            >
              {currentStep === totalSteps ? 'Complete Setup' : 'Next Step'}
            </button>
          </div>
          
          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {errors.submit}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 