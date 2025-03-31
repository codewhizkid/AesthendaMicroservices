import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegistrationSuccess = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect to home if user navigates here directly without registering
  useEffect(() => {
    // If no registration just happened (no user or already on dashboard), redirect
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white border-[16px] border-[#A9A29A] w-full max-w-lg mx-auto">
        {/* Browser-like header with dots */}
        <div className="border-b border-gray-200 px-4 py-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
        
        {/* Success header */}
        <div className="bg-[#A9A29A] py-8 px-6 text-center">
          <h1 className="font-serif text-2xl uppercase tracking-widest text-white mb-2">Welcome to Aesthenda!</h1>
          <p className="text-white text-opacity-90">Your account has been created successfully</p>
        </div>
        
        {/* Main content */}
        <div className="px-6 py-8">
          <div className="text-center mb-8">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800">Registration Complete</h2>
          </div>
          
          <div className="mb-8 text-gray-600">
            <p className="mb-4">
              Hello {currentUser?.firstName || 'there'},
            </p>
            <p className="mb-4">
              Thank you for creating an account with Aesthenda Salon Management. We're excited to have you!
            </p>
            <p className="mb-4">
              The next step is to choose a subscription plan that's right for your business. We offer options for independent stylists, hair studios, and full-service salons.
            </p>
            <p className="mb-4">
              We've sent a welcome email to <strong>{currentUser?.email}</strong> with more information.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <Link 
              to="/plan-selection" 
              className="w-full bg-[#A9A29A] text-center text-black py-3 px-4 hover:bg-[#918b84] transition-colors uppercase tracking-widest"
            >
              Choose Your Plan
            </Link>
            
            <Link 
              to="/" 
              className="text-center text-[#A9A29A] hover:underline"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess; 