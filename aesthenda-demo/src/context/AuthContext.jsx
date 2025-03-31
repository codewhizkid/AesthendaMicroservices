import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { users } from '../api/mockData'; // Import mock users for fallback
import { sendWelcomeEmail } from '../utils/emailService';

// Create context
const AuthContext = createContext();

// API base URL 
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || true; // Default to mock for demo

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configure axios defaults
  axios.defaults.withCredentials = true; // Allow cookies for sessions

  // Check if the user is already logged in when the app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        
        if (USE_MOCK_API) {
          // Check local storage for saved mock user
          const savedUser = localStorage.getItem('mock_user');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
          setLoading(false);
          return;
        }
        
        // Try to get the current user from the server
        const response = await axios.get(`${API_URL}/auth/me`);
        
        if (response.data && response.data.user) {
          setCurrentUser(response.data.user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.log('Not authenticated');
        // If there's an error, the user is not authenticated
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Function to set tokens in local storage (for JWT authentication)
  const setAuthTokens = (tokens) => {
    if (tokens?.accessToken) {
      localStorage.setItem('accessToken', tokens.accessToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
    
    if (tokens?.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
  };

  // Function to remove tokens from local storage
  const clearAuthTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('mock_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Login functionality
  const login = async (email, password) => {
    try {
      setError(null);
      
      if (USE_MOCK_API) {
        // Mock authentication logic
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
          setError('Invalid email or password');
          return false;
        }
        
        // Store user in local storage but remove the password
        const { password: _, ...safeUser } = user;
        localStorage.setItem('mock_user', JSON.stringify(safeUser));
        
        setCurrentUser(safeUser);
        setIsAuthenticated(true);
        return true;
      }
      
      // Real API call
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      
      const { user, tokens } = response.data;
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // If using JWT authentication
      if (tokens) {
        setAuthTokens(tokens);
      }
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      return false;
    }
  };

  // Register functionality
  const register = async (userData) => {
    try {
      setError(null);
      
      if (USE_MOCK_API) {
        // Simple mock registration - just simulate success
        // In a real app, you would validate and store the new user
        const mockUser = {
          id: 'new-' + Date.now(),
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'client',
          tenantId: 'salon1', // Default tenant for demo
        };
        
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        setCurrentUser(mockUser);
        setIsAuthenticated(true);
        
        // Send welcome email (mock)
        try {
          await sendWelcomeEmail(mockUser);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail registration if email fails
        }
        
        return {
          success: true,
          user: mockUser,
          registrationCompleted: true
        };
      }
      
      // Real API call
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      const { user, tokens } = response.data;
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // If using JWT authentication
      if (tokens) {
        setAuthTokens(tokens);
      }
      
      // Send welcome email
      try {
        await sendWelcomeEmail(user);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail registration if email fails
      }
      
      return {
        success: true,
        user,
        registrationCompleted: true
      };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Logout functionality
  const logout = async () => {
    try {
      if (!USE_MOCK_API) {
        await axios.post(`${API_URL}/auth/logout`);
      }
      
      setCurrentUser(null);
      setIsAuthenticated(false);
      clearAuthTokens();
      
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      
      // Even if server logout fails, clear local state
      setCurrentUser(null);
      setIsAuthenticated(false);
      clearAuthTokens();
      
      return false;
    }
  };

  // For development/demo purposes, provide a method to simulate login without backend
  const simulateLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('mock_user', JSON.stringify(user));
    return true;
  };

  // Value object to be provided through the context
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    simulateLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 