import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import * as apiService from '../services/apiService';

// Create context
const AdminContext = createContext();

// Initial state for the admin panel
const initialState = {
  currentUser: null,
  salon: null,
  roles: [],
  staff: [],
  serviceCategories: [],
  services: [],
  isLoading: false,
  alerts: []
};

// Action types
const ActionTypes = {
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SET_SALON: 'SET_SALON',
  SET_ROLES: 'SET_ROLES',
  SET_STAFF: 'SET_STAFF',
  SET_SERVICE_CATEGORIES: 'SET_SERVICE_CATEGORIES',
  SET_SERVICES: 'SET_SERVICES',
  SET_LOADING: 'SET_LOADING',
  ADD_ALERT: 'ADD_ALERT',
  REMOVE_ALERT: 'REMOVE_ALERT',
  
  // Entity-specific actions
  ADD_ROLE: 'ADD_ROLE',
  UPDATE_ROLE: 'UPDATE_ROLE',
  REMOVE_ROLE: 'REMOVE_ROLE',
  
  ADD_STAFF: 'ADD_STAFF',
  UPDATE_STAFF: 'UPDATE_STAFF',
  REMOVE_STAFF: 'REMOVE_STAFF',
  
  ADD_SERVICE_CATEGORY: 'ADD_SERVICE_CATEGORY',
  UPDATE_SERVICE_CATEGORY: 'UPDATE_SERVICE_CATEGORY',
  REMOVE_SERVICE_CATEGORY: 'REMOVE_SERVICE_CATEGORY',
  
  ADD_SERVICE: 'ADD_SERVICE',
  UPDATE_SERVICE: 'UPDATE_SERVICE',
  REMOVE_SERVICE: 'REMOVE_SERVICE'
};

// Reducer function
const adminReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload };
      
    case ActionTypes.SET_SALON:
      return { ...state, salon: action.payload };
      
    case ActionTypes.SET_ROLES:
      return { ...state, roles: action.payload };
      
    case ActionTypes.SET_STAFF:
      return { ...state, staff: action.payload };
      
    case ActionTypes.SET_SERVICE_CATEGORIES:
      return { ...state, serviceCategories: action.payload };
      
    case ActionTypes.SET_SERVICES:
      return { ...state, services: action.payload };
      
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
      
    case ActionTypes.ADD_ALERT:
      return { 
        ...state, 
        alerts: [...state.alerts, { id: Date.now(), ...action.payload }] 
      };
      
    case ActionTypes.REMOVE_ALERT:
      return { 
        ...state, 
        alerts: state.alerts.filter(alert => alert.id !== action.payload) 
      };
      
    // Role actions
    case ActionTypes.ADD_ROLE:
      return { ...state, roles: [...state.roles, action.payload] };
      
    case ActionTypes.UPDATE_ROLE:
      return { 
        ...state, 
        roles: state.roles.map(role => 
          role.id === action.payload.id ? action.payload : role
        ) 
      };
      
    case ActionTypes.REMOVE_ROLE:
      return { 
        ...state, 
        roles: state.roles.filter(role => role.id !== action.payload) 
      };
      
    // Staff actions
    case ActionTypes.ADD_STAFF:
      return { ...state, staff: [...state.staff, action.payload] };
      
    case ActionTypes.UPDATE_STAFF:
      return { 
        ...state, 
        staff: state.staff.map(member => 
          member.id === action.payload.id ? action.payload : member
        ) 
      };
      
    case ActionTypes.REMOVE_STAFF:
      return { 
        ...state, 
        staff: state.staff.filter(member => member.id !== action.payload) 
      };
      
    // Service category actions
    case ActionTypes.ADD_SERVICE_CATEGORY:
      return { 
        ...state, 
        serviceCategories: [...state.serviceCategories, action.payload] 
      };
      
    case ActionTypes.UPDATE_SERVICE_CATEGORY:
      return { 
        ...state, 
        serviceCategories: state.serviceCategories.map(category => 
          category.id === action.payload.id ? action.payload : category
        ) 
      };
      
    case ActionTypes.REMOVE_SERVICE_CATEGORY:
      return { 
        ...state, 
        serviceCategories: state.serviceCategories.filter(category => 
          category.id !== action.payload
        ) 
      };
      
    // Service actions
    case ActionTypes.ADD_SERVICE:
      return { ...state, services: [...state.services, action.payload] };
      
    case ActionTypes.UPDATE_SERVICE:
      return { 
        ...state, 
        services: state.services.map(service => 
          service.id === action.payload.id ? action.payload : service
        ) 
      };
      
    case ActionTypes.REMOVE_SERVICE:
      return { 
        ...state, 
        services: state.services.filter(service => service.id !== action.payload) 
      };
      
    default:
      return state;
  }
};

// Provider component
export const AdminProvider = ({ children }) => {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  
  // Helper function to show alerts
  const showAlert = (message, type = 'success', timeout = 5000) => {
    const id = Date.now();
    dispatch({ 
      type: ActionTypes.ADD_ALERT, 
      payload: { id, message, type }
    });
    
    // Auto-remove alert after timeout
    setTimeout(() => {
      dispatch({ type: ActionTypes.REMOVE_ALERT, payload: id });
    }, timeout);
  };
  
  // Load current user from localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        if (userData && userData.id) {
          dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: userData });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);
  
  // API actions with error handling
  const apiActions = {
    // Salon profile actions
    loadSalonProfile: async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await apiService.salonApi.getProfile();
        dispatch({ type: ActionTypes.SET_SALON, payload: data });
        return data;
      } catch (error) {
        showAlert(`Error loading salon profile: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    updateSalonProfile: async (profileData) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await apiService.salonApi.updateProfile(profileData);
        dispatch({ type: ActionTypes.SET_SALON, payload: data });
        showAlert('Salon profile updated successfully', 'success');
        return data;
      } catch (error) {
        showAlert(`Error updating salon profile: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    // Role management actions
    loadRoles: async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await apiService.rolesApi.getRoles();
        dispatch({ type: ActionTypes.SET_ROLES, payload: data });
        return data;
      } catch (error) {
        showAlert(`Error loading roles: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    createRole: async (role) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await apiService.rolesApi.createRole(role);
        dispatch({ type: ActionTypes.ADD_ROLE, payload: data });
        showAlert('Role created successfully', 'success');
        return data;
      } catch (error) {
        showAlert(`Error creating role: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    updateRole: async (roleId, role) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await apiService.rolesApi.updateRole(roleId, role);
        dispatch({ type: ActionTypes.UPDATE_ROLE, payload: data });
        showAlert('Role updated successfully', 'success');
        return data;
      } catch (error) {
        showAlert(`Error updating role: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    deleteRole: async (roleId) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        await apiService.rolesApi.deleteRole(roleId);
        dispatch({ type: ActionTypes.REMOVE_ROLE, payload: roleId });
        showAlert('Role deleted successfully', 'success');
      } catch (error) {
        showAlert(`Error deleting role: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    // Staff management actions
    loadStaff: async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await apiService.staffApi.getStaff();
        dispatch({ type: ActionTypes.SET_STAFF, payload: data });
        return data;
      } catch (error) {
        showAlert(`Error loading staff: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    assignRoleToStaff: async (staffId, roleId) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await apiService.staffApi.assignRole(staffId, roleId);
        dispatch({ type: ActionTypes.UPDATE_STAFF, payload: data });
        showAlert('Role assigned successfully', 'success');
        return data;
      } catch (error) {
        showAlert(`Error assigning role: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    // Service categories actions
    loadServiceCategories: async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await apiService.servicesApi.getCategories();
        dispatch({ type: ActionTypes.SET_SERVICE_CATEGORIES, payload: data });
        return data;
      } catch (error) {
        showAlert(`Error loading service categories: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    },
    
    // Services actions
    loadServices: async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await apiService.servicesApi.getServices();
        dispatch({ type: ActionTypes.SET_SERVICES, payload: data });
        return data;
      } catch (error) {
        showAlert(`Error loading services: ${error.message}`, 'error');
        throw error;
      } finally {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    }
  };
  
  // Value to be provided by the context
  const contextValue = {
    state,
    dispatch,
    showAlert,
    actions: apiActions
  };
  
  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

// Custom hook to use the admin context
export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminProvider');
  }
  return context;
};

export { ActionTypes };
export default AdminContext; 