import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getTenantData, salons } from '../api/mockData';

// Create the tenant context
const TenantContext = createContext();

// Custom hook to use the tenant context
export const useTenant = () => {
  return useContext(TenantContext);
};

// Provider component to wrap the app and provide tenant state
export const TenantProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [currentTenant, setCurrentTenant] = useState(null);
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Effect to fetch tenant data when the user changes
  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!currentUser || !currentUser.tenantId) {
          setCurrentTenant(null);
          setTenantData(null);
          return;
        }
        
        // Find the salon for this tenant
        const salon = salons.find(s => s.tenantId === currentUser.tenantId);
        
        if (!salon) {
          setError('Tenant not found');
          return;
        }
        
        setCurrentTenant(salon);
        
        // Get all data for this tenant
        const data = getTenantData(currentUser.tenantId);
        setTenantData(data);
      } catch (err) {
        console.error('Error fetching tenant data:', err);
        setError('Failed to load salon data');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, [currentUser]);

  // Get tenant primary color with fallback
  const getPrimaryColor = () => {
    return currentTenant?.settings?.branding?.primaryColor || '#0ea5e9'; // Default blue if no tenant
  };

  // Get tenant secondary color with fallback
  const getSecondaryColor = () => {
    return currentTenant?.settings?.branding?.secondaryColor || '#64748b'; // Default gray if no tenant
  };

  // Get tenant font family with fallback
  const getFontFamily = () => {
    return currentTenant?.settings?.branding?.fontFamily || 'Inter, sans-serif';
  };

  // Apply tenant styles to the document
  useEffect(() => {
    if (currentTenant?.settings?.branding) {
      const { primaryColor, secondaryColor, fontFamily } = currentTenant.settings.branding;
      
      // Create a style element to inject the CSS variables
      const style = document.createElement('style');
      style.innerHTML = `
        :root {
          --color-primary: ${primaryColor || '#0ea5e9'};
          --color-secondary: ${secondaryColor || '#64748b'};
          --font-family: ${fontFamily || 'Inter, sans-serif'};
        }
        
        body {
          font-family: var(--font-family);
        }
      `;
      
      // Add the style to the head
      document.head.appendChild(style);
      
      // Clean up on unmount
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [currentTenant]);

  // Function to get tenant-specific data based on the type
  const getTenantResource = (resourceType) => {
    if (!tenantData) return [];
    
    switch (resourceType) {
      case 'staff':
        return tenantData.staff || [];
      case 'services':
        return tenantData.services || [];
      case 'appointments':
        return tenantData.appointments || [];
      default:
        return [];
    }
  };

  // Function to get stylist-specific appointments
  const getStylistAppointments = () => {
    if (!tenantData || !currentUser || !currentUser.stylist_id) return [];
    
    return tenantData.appointments.filter(a => a.stylist_id === currentUser.stylist_id);
  };

  // Value to provide in the context
  const value = {
    currentTenant,
    tenantData,
    loading,
    error,
    getPrimaryColor,
    getSecondaryColor,
    getFontFamily,
    getTenantResource,
    getStylistAppointments
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export default TenantContext; 