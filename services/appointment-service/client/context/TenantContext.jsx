import React, { createContext, useState, useEffect } from 'react';

export const TenantContext = createContext();

export const TenantProvider = ({ children }) => {
  const [tenantId, setTenantId] = useState(null);
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real application, you would fetch this from your authentication system
    // For now, we'll use a mock tenant ID
    const mockTenantId = process.env.VITE_MOCK_TENANT_ID || 'default-tenant';
    setTenantId(mockTenantId);
    setTenantData({
      id: mockTenantId,
      name: 'Demo Salon',
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        businessHours: {
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' },
          saturday: { start: '10:00', end: '16:00' },
          sunday: null
        }
      }
    });
    setLoading(false);
  }, []);

  const value = {
    tenantId,
    tenantData,
    loading,
    setTenantId,
    setTenantData
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export default TenantProvider;