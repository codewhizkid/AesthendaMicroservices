import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = ({ onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await register({
        firstName,
        lastName,
        email,
        password
      });
      
      if (result.success) {
        if (onClose) {
          onClose(); // Close the modal if it's open
        }
        // Redirect to success page instead of dashboard
        navigate('/registration-success');
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    // Direct to backend OAuth endpoints
    window.location.href = `/api/auth/${provider}`;
  };

  return (
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
      
      {/* Welcome text */}
      <div className="text-center py-8">
        <h1 className="font-serif text-xl uppercase tracking-widest">Welcome to the</h1>
        <h2 className="font-serif text-xl uppercase tracking-widest">Family</h2>
      </div>
      
      {/* Gray header bar */}
      <div className="bg-[#A9A29A] py-2 px-3 flex items-center">
        <span className="text-xs text-white opacity-75">•••</span>
      </div>
      
      {/* Registration form */}
      <div className="px-6 py-8">
        <h3 className="text-xl font-bold text-center mb-4">Create New Account</h3>
        <p className="text-center text-sm mb-8">
          Already Registered? <Link to="/login" className="text-[#A9A29A] hover:underline">Login</Link>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="firstName" className="block text-xs uppercase font-medium text-gray-700 mb-1">First Name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-xs uppercase font-medium text-gray-700 mb-1">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-xs uppercase font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-xs uppercase font-medium text-gray-700 mb-1">Create Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-xs uppercase font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#A9A29A] text-black py-2 px-4 hover:bg-[#918b84] transition-colors text-sm uppercase tracking-widest"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
        
        {/* Social login icons */}
        <div className="mt-8 flex justify-center space-x-6">
          <button 
            onClick={() => handleSocialLogin('facebook')}
            className="flex items-center justify-center"
            aria-label="Sign up with Facebook"
          >
            <svg className="w-10 h-10" viewBox="0 0 48 48">
              <path fill="#3F51B5" d="M42,37c0,2.8-2.2,5-5,5H11c-2.8,0-5-2.2-5-5V11c0-2.8,2.2-5,5-5h26c2.8,0,5,2.2,5,5V37z"/>
              <path fill="#FFFFFF" d="M34.4,25H31v13h-5V25h-3v-4h3v-2.9c0.2-3.1,1.3-5.1,4.9-5.1c1,0,2.6,0.1,3.1,0.1V17h-2.1c-1.6,0-2,0.8-2,2.1  V21h4L34.4,25z"/>
            </svg>
          </button>
          
          <button 
            onClick={() => handleSocialLogin('google')}
            className="flex items-center justify-center"
            aria-label="Sign up with Google"
          >
            <svg className="w-10 h-10" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6,20H24v8h11.3c-1.1,5.2-5.5,8-11.3,8c-6.6,0-12-5.4-12-12s5.4-12,12-12c3,0,5.8,1.1,7.9,3l6-6 C34,5.8,29.1,4,24,4C13,4,4,13,4,24s9,20,20,20s20-9,20-20C44,22.7,43.9,21.3,43.6,20z"/>
              <path fill="#FF3D00" d="M6.3,14.7l7,5.4c1.6-4.8,6.2-8.1,11.7-8.1c3,0,5.8,1.1,7.9,3l6-6C34,5.8,29.1,4,24,4 C16.3,4,9.6,8.4,6.3,14.7z"/>
              <path fill="#4CAF50" d="M24,44c4.9,0,9.5-1.6,13.2-4.5l-6.4-5.4c-2,1.4-4.6,2-7.2,2c-5.8,0-10.7-3.3-11.7-8h-7l-0.3,0.3 C7.8,36.1,15.2,44,24,44z"/>
              <path fill="#1976D2" d="M43.6,20H24v8h11.3c-0.5,2.5-2,4.6-4.2,6l6.4,5.4c3.7-3.5,6-8.5,6-14.4C44,22.7,43.9,21.3,43.6,20z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register; 