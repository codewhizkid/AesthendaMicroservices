import apiClient from './apiClient';
import authService from './authService';
import tenantService from './tenantService';
import paymentService from './paymentService';
import { ENABLE_MOCK_API } from '../config';

// Import mock data for fallback/development
import * as mockData from './mockData';

/**
 * API Services
 * 
 * This module exports all API services with an option to fall back to mock data
 * when the API is not available or for development purposes.
 */

// Conditional export based on configuration
const api = {
  client: apiClient,
  auth: authService,
  tenant: tenantService,
  payment: paymentService,
  
  // Utility for checking if using mock data
  isMockData: () => ENABLE_MOCK_API,
  
  // Mock data for fallback
  mock: mockData
};

export default api;