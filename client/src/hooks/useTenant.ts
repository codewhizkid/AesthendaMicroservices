import { useState, useEffect } from 'react';

// Mock tenant data for development
const mockTenant = {
  id: 'tenant-1',
  name: 'Demo Salon',
  timezone: 'America/New_York',
  settings: {
    businessHours: {
      monday: { start: '09:00', end: '17:00', isOpen: true },
      tuesday: { start: '09:00', end: '17:00', isOpen: true },
      wednesday: { start: '09:00', end: '17:00', isOpen: true },
      thursday: { start: '09:00', end: '17:00', isOpen: true },
      friday: { start: '09:00', end: '17:00', isOpen: true },
      saturday: { start: '10:00', end: '15:00', isOpen: true },
      sunday: { start: '00:00', end: '00:00', isOpen: false },
    },
    appointmentDuration: 60, // minutes
    colorScheme: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
    },
  },
};

export const useTenant = () => {
  const [tenant, setTenant] = useState(mockTenant);
  const [isLoading, setIsLoading] = useState(false);

  // In a real application, this would fetch tenant data from the API
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setTenant(mockTenant);
      setIsLoading(false);
    }, 500);
  }, []);

  return {
    tenant,
    isLoading,
  };
};

export default useTenant; 