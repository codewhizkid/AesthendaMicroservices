import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api';
import { ENABLE_MOCK_API } from '../config';

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
        
        if (ENABLE_MOCK_API) {
          // For demo purposes, we get tenant data from our mock data
          const data = api.mock.getTenantData(currentUser.tenantId);
          
          if (data) {
            setTenantData(data);
            
            // If the user is a stylist, fetch their appointments
            if (currentUser.role === 'stylist' && currentUser.stylist_id) {
              const stylistAppointments = api.mock.getStylistAppointments(
                currentUser.tenantId, 
                currentUser.stylist_id
              );
              setAppointments(stylistAppointments);
            }
            // If the user is a salon admin, they would see all appointments
            else if (currentUser.role === 'salon_admin') {
              const allAppointments = api.mock.getStylistAppointments(currentUser.tenantId);
              setAppointments(allAppointments);
            }
          } else {
            setError('Tenant data not found');
          }
        } else {
          // Use real API services
          const salonResult = await api.tenant.getSalonByTenantId(currentUser.tenantId);
          
          if (salonResult.success) {
            setTenantData(salonResult.data);
            
            // Fetch appointments based on user role
            if (currentUser.role === 'stylist' && currentUser.stylist_id) {
              // Stylist only sees their own appointments
              const appointmentsResult = await api.tenant.getAppointments(
                currentUser.tenantId, 
                currentUser.stylist_id
              );
              
              if (appointmentsResult.success) {
                setAppointments(appointmentsResult.data);
              }
            } else if (currentUser.role === 'salon_admin') {
              // Admin sees all salon appointments
              const appointmentsResult = await api.tenant.getAppointments(currentUser.tenantId);
              
              if (appointmentsResult.success) {
                setAppointments(appointmentsResult.data);
              }
            }
          } else {
            setError(salonResult.error || 'Failed to load tenant data');
          }
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
  const getStylistAppointmentsFunc = () => {
    return appointments;
  };

  // Update salon branding
  const updateBranding = async (brandingData) => {
    if (!currentUser?.tenantId) return { success: false, error: 'No tenant ID available' };
    
    try {
      if (ENABLE_MOCK_API) {
        // In mock mode, just update the local state
        setTenantData(prev => ({
          ...prev,
          branding: {
            ...prev.branding,
            ...brandingData
          }
        }));
        return { success: true };
      }
      
      // Use real API service
      const result = await api.tenant.updateBranding(currentUser.tenantId, brandingData);
      
      if (result.success) {
        // Update local state with the returned data
        setTenantData(prev => ({
          ...prev,
          branding: result.data.branding
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error updating branding:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update branding' 
      };
    }
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
    getStylistAppointments: getStylistAppointmentsFunc,
    updateBranding
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export default TenantContext; 