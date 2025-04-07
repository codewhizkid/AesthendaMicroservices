import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';
import { STORAGE_KEYS, ENABLE_MOCK_API } from '../config';
import { sendWelcomeEmail } from '../utils/emailService';

// Create context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is already logged in when the app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        
        if (ENABLE_MOCK_API) {
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
        
        // Try to get the current user using our auth service
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        const isValid = await api.auth.verifyToken();
        
        if (!isValid) {
          // Clear invalid token
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        const result = await api.auth.getCurrentUser();
        
        if (result.success && result.user) {
          setCurrentUser(result.user);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setCurrentUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login functionality
  const login = async (email, password, firstName = '', lastName = '') => {
    try {
      setError(null);
      
      if (ENABLE_MOCK_API) {
        // Mock authentication logic
        const user = api.mock.users.find(u => u.email === email && u.password === password);
        
        if (!user) {
          setError('Invalid email or password');
          return false;
        }
        
        // Store user in local storage but remove the password
        const { password: _, ...safeUser } = user;
        
        // If first name and last name are provided and the user doesn't have them, add them
        if (firstName && !safeUser.firstName) {
          safeUser.firstName = firstName;
        }
        
        if (lastName && !safeUser.lastName) {
          safeUser.lastName = lastName;
        }
        
        localStorage.setItem('mock_user', JSON.stringify(safeUser));
        
        setCurrentUser(safeUser);
        setIsAuthenticated(true);
        return true;
      }
      
      // Use the auth service for login
      const result = await api.auth.login(email, password, firstName, lastName);
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      return false;
    }
  };

  // Register functionality
  const register = async (userData) => {
    try {
      setError(null);
      
      if (ENABLE_MOCK_API) {
        // Simple mock registration - just simulate success
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
      
      // Use the auth service for registration
      const result = await api.auth.register(userData);
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        
        // Send welcome email
        try {
          await sendWelcomeEmail(result.user);
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't fail registration if email fails
        }
        
        return {
          success: true,
          user: result.user,
          registrationCompleted: true
        };
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        return {
          success: false,
          error: result.error || 'Registration failed'
        };
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      return {
        success: false,
        error: err.message || 'Registration failed'
      };
    }
  };

  // Logout functionality
  const logout = async () => {
    try {
      if (!ENABLE_MOCK_API) {
        // Use the auth service for logout
        await api.auth.logout();
      }
      
      // Always clear local data
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem('mock_user');
      
      // Update state
      setCurrentUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear the user from state even if server logout fails
      setCurrentUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Export the context value
  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    setError
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