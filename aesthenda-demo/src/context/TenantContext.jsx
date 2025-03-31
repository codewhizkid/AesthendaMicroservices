import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getTenantData, getStylistAppointments } from '../api/mockData';

// Create the tenant context
const TenantContext = createContext();

// Custom hook to use the tenant context
export const useTenant = () => {
  return useContext(TenantContext);
};

// Provider component to wrap the app and provide tenant state
export const TenantProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [tenantData, setTenantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);

  // Fetch tenant data when user authentication changes
  useEffect(() => {
    const fetchTenantData = async () => {
      if (!isAuthenticated || !currentUser?.tenantId) {
        setTenantData(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // For demo purposes, we get tenant data from our mock data
        const data = getTenantData(currentUser.tenantId);
        
        if (data) {
          setTenantData(data);
          
          // If the user is a stylist, fetch their appointments
          if (currentUser.role === 'stylist' && currentUser.stylist_id) {
            const stylistAppointments = getStylistAppointments(
              currentUser.tenantId, 
              currentUser.stylist_id
            );
            setAppointments(stylistAppointments);
          }
          // If the user is a salon admin, they would see all appointments
          else if (currentUser.role === 'salon_admin') {
            // In a real app, this would be a different API call to get all tenant appointments
            // For demo, we'll use the same function but with no stylist_id filter
            const allAppointments = getStylistAppointments(currentUser.tenantId);
            setAppointments(allAppointments);
          }
        } else {
          console.error('No tenant data found for ID:', currentUser.tenantId);
          setError('Tenant data not found');
        }
      } catch (err) {
        console.error('Error fetching tenant data:', err);
        setError('Failed to load tenant data');
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, [isAuthenticated, currentUser]);

  // Helper functions to get tenant-specific values
  const getPrimaryColor = () => {
    return tenantData?.branding?.primaryColor || '#0EA5E9';
  };

  const getSecondaryColor = () => {
    return tenantData?.branding?.secondaryColor || '#6366F1';
  };

  const getFontFamily = () => {
    return tenantData?.branding?.fontFamily || 'Inter, sans-serif';
  };

  // Set CSS variables for tenant branding when tenant data changes
  useEffect(() => {
    if (tenantData?.branding) {
      const { primaryColor, secondaryColor, fontFamily, textColor, backgroundColor } = tenantData.branding;
      
      // Set CSS custom properties for tenant branding
      document.documentElement.style.setProperty('--tenant-primary', primaryColor || '#0EA5E9');
      document.documentElement.style.setProperty('--tenant-secondary', secondaryColor || '#6366F1');
      document.documentElement.style.setProperty('--tenant-bg', backgroundColor || '#F9FAFB');
      document.documentElement.style.setProperty('--tenant-text', textColor || '#1F2937');
      document.documentElement.style.setProperty('--tenant-font-family', fontFamily || 'Inter, sans-serif');
      
      // You could also dynamically load fonts here if needed
    }
  }, [tenantData]);

  // Get tenant-specific resource (like images, logos, etc.)
  const getTenantResource = (resourceType) => {
    if (!tenantData?.resources) return null;
    
    switch (resourceType) {
      case 'logo':
        return tenantData.resources.logo || '/placeholder-logo.svg';
      case 'banner':
        return tenantData.resources.banner || '/placeholder-banner.jpg';
      default:
        return null;
    }
  };

  // Provide appointments specific to the tenant
  const getStylistAppointments = () => {
    return appointments;
  };

  const value = {
    tenantData,
    loading,
    error,
    currentTenantId: currentUser?.tenantId,
    appointments,
    getPrimaryColor,
    getSecondaryColor,
    getFontFamily,
    getTenantResource,
    getStylistAppointments
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export default TenantContext; 