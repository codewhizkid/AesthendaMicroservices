import { useState, useEffect } from 'react';

// Mock user data for development
const mockUser = {
  id: 'user-1',
  name: 'Demo User',
  email: 'user@example.com',
  role: 'ADMIN',
  tenantId: 'tenant-1',
};

export const useAuth = () => {
  const [user, setUser] = useState(mockUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // In a real application, this would check for a token in local storage
  // and validate it with the backend
  useEffect(() => {
    // Mock authentication check
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsAuthenticated(true);
      setIsLoading(false);
    }, 500);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    login: () => setIsAuthenticated(true),
    logout: () => setIsAuthenticated(false),
  };
};

export default useAuth; 