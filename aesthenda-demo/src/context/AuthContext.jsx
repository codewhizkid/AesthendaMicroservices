import React, { createContext, useState, useContext, useEffect } from 'react';
import { authenticate, verifyToken } from '../api/mockData';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component to wrap the app and provide auth state
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aesthenda_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Effect to check token on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        if (token) {
          const userData = verifyToken(token);
          if (userData) {
            setCurrentUser(userData);
          } else {
            // Invalid token
            localStorage.removeItem('aesthenda_token');
            setToken(null);
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('Session expired. Please log in again.');
        localStorage.removeItem('aesthenda_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      
      const result = await authenticate(email, password);
      
      if (!result) {
        setError('Invalid email or password');
        return false;
      }
      
      setCurrentUser(result.user);
      setToken(result.token);
      
      // Store token in localStorage for persistence
      localStorage.setItem('aesthenda_token', result.token);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to log in. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('aesthenda_token');
  };

  // Check if user has a specific role
  const hasRole = (role) => {
    if (!currentUser) return false;
    
    if (Array.isArray(role)) {
      return role.includes(currentUser.role);
    }
    
    return currentUser.role === role;
  };

  // Value to provide in the context
  const value = {
    currentUser,
    token,
    loading,
    error,
    login,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 