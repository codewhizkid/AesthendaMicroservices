import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Payment = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvc: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: 'USA',
    agreeTerms: false
  });
  const [errors, setErrors] = useState({});

  const plans = {
    independent: {
      title: 'Independent Stylist',
      price: 29,
      description: 'Perfect for solo stylists who rent a chair or work from home.'
    },
    studio: {
      title: 'Hair Studio',
      price: 79,
      description: 'Ideal for small studios with 2-5 stylists sharing space.'
    },
    salon: {
      title: 'Full Salon',
      price: 149,
      description: 'Complete solution for established salons with multiple staff members.'
    }
  };

  // Load selected plan from localStorage
  useEffect(() => {
    const storedPlan = localStorage.getItem('selected_plan');
    if (!storedPlan) {
      navigate('/plan-selection');
      return;
    }
    setSelectedPlan(plans[storedPlan]);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cardNumber.trim()) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number';
    }
    
    if (!formData.cardName.trim()) {
      newErrors.cardName = 'Name on card is required';
    }
    
    if (!formData.expiry.trim()) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiry)) {
      newErrors.expiry = 'Invalid format (MM/YY)';
    }
    
    if (!formData.cvc.trim()) {
      newErrors.cvc = 'CVC is required';
    } else if (!/^\d{3,4}$/.test(formData.cvc)) {
      newErrors.cvc = 'Invalid CVC';
    }
    
    if (!formData.billingAddress.trim()) {
      newErrors.billingAddress = 'Billing address is required';
    }
    
    if (!formData.billingCity.trim()) {
      newErrors.billingCity = 'City is required';
    }
    
    if (!formData.billingState.trim()) {
      newErrors.billingState = 'State is required';
    }
    
    if (!formData.billingZip.trim()) {
      newErrors.billingZip = 'Zip code is required';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would process the payment
      // Simulate API call with setTimeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Store tenant info with plan details
      localStorage.setItem('tenant_plan', JSON.stringify({
        planId: localStorage.getItem('selected_plan'),
        subscriptionDate: new Date().toISOString(),
        status: 'active'
      }));
      
      // Navigate to onboarding
      navigate('/onboarding');
    } catch (error) {
      console.error('Payment processing error:', error);
      setErrors({
        submit: 'There was an error processing your payment. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="bg-[#A9A29A] py-6 px-6 text-center">
          <h1 className="font-serif text-2xl uppercase tracking-wider text-white">Complete Your Purchase</h1>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="md:col-span-2">
              <h2 className="font-serif text-xl mb-6">Payment Details</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    placeholder="1234 5678 9012 3456"
                    className={`w-full p-2 border ${errors.cardNumber ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.cardNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full p-2 border ${errors.cardName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.cardName && (
                    <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleChange}
                      placeholder="MM/YY"
                      className={`w-full p-2 border ${errors.expiry ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.expiry && (
                      <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      name="cvc"
                      value={formData.cvc}
                      onChange={handleChange}
                      placeholder="123"
                      className={`w-full p-2 border ${errors.cvc ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.cvc && (
                      <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>
                    )}
                  </div>
                </div>
                
                <h3 className="font-serif text-lg mt-8 mb-4">Billing Address</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    placeholder="123 Main St"
                    className={`w-full p-2 border ${errors.billingAddress ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.billingAddress && (
                    <p className="text-red-500 text-xs mt-1">{errors.billingAddress}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="billingCity"
                      value={formData.billingCity}
                      onChange={handleChange}
                      className={`w-full p-2 border ${errors.billingCity ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.billingCity && (
                      <p className="text-red-500 text-xs mt-1">{errors.billingCity}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="billingState"
                      value={formData.billingState}
                      onChange={handleChange}
                      className={`w-full p-2 border ${errors.billingState ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.billingState && (
                      <p className="text-red-500 text-xs mt-1">{errors.billingState}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      name="billingZip"
                      value={formData.billingZip}
                      onChange={handleChange}
                      className={`w-full p-2 border ${errors.billingZip ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.billingZip && (
                      <p className="text-red-500 text-xs mt-1">{errors.billingZip}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <select
                      name="billingCountry"
                      value={formData.billingCountry}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300"
                    >
                      <option value="USA">United States</option>
                      <option value="CAN">Canada</option>
                      <option value="GBR">United Kingdom</option>
                      <option value="AUS">Australia</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#A9A29A] focus:ring-[#A9A29A] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      I agree to the <a href="#" className="text-[#C0A371] hover:underline">Terms of Service</a> and <a href="#" className="text-[#C0A371] hover:underline">Privacy Policy</a>
                    </span>
                  </label>
                  {errors.agreeTerms && (
                    <p className="text-red-500 text-xs mt-1">{errors.agreeTerms}</p>
                  )}
                </div>
                
                {errors.submit && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                    {errors.submit}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#C0A371] hover:bg-[#b0946a] text-white py-3 px-4 uppercase tracking-widest transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Complete Purchase'}
                </button>
              </form>
            </div>
            
            {/* Order Summary */}
            <div className="bg-gray-50 p-6">
              <h2 className="font-serif text-xl mb-6">Order Summary</h2>
              
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">{selectedPlan.title} Plan</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedPlan.description}</p>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subscription</span>
                  <span className="font-medium">${selectedPlan.price}/month</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${(selectedPlan.price * 0.07).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold">${(selectedPlan.price * 1.07).toFixed(2)}</span>
              </div>
              
              <div className="mt-8 text-sm text-gray-500">
                <p>Your subscription will renew automatically each month. You can cancel or change your plan at any time from your account settings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment; 