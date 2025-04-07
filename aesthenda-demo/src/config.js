/**
 * Configuration Utility
 * Centralizes access to environment variables and application settings
 */

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Feature Flags
export const ENABLE_MOCK_API = import.meta.env.VITE_ENABLE_MOCK_API === 'true';
export const ENABLE_GOOGLE_LOGIN = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN !== 'false';
export const ENABLE_FACEBOOK_LOGIN = import.meta.env.VITE_ENABLE_FACEBOOK_LOGIN !== 'false';

// Application Settings
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Aesthenda Salon Management';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0';

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SELECTED_PLAN: 'selected_plan',
  TENANT_SETTINGS: 'tenant_settings'
};

// Default Plans (fallback)
export const DEFAULT_PLANS = [
  {
    id: 'independent',
    title: 'Independent Stylist',
    price: 29,
    description: 'Perfect for solo stylists who rent a chair or work from home.',
    features: [
      'Client booking system',
      'Calendar management',
      'Up to 100 clients',
      'Basic reporting',
      'Email notifications',
      'Mobile-friendly access'
    ]
  },
  {
    id: 'studio',
    title: 'Hair Studio',
    price: 79,
    description: 'Ideal for small studios with 2-5 stylists sharing space.',
    features: [
      'Everything in Independent plan',
      'Up to 5 stylist accounts',
      'Resource scheduling',
      'Staff management',
      'Expanded reporting',
      'Custom branding',
      'Client messaging'
    ],
    recommended: true
  },
  {
    id: 'salon',
    title: 'Full Salon',
    price: 149,
    description: 'Complete solution for established salons with multiple staff members.',
    features: [
      'Everything in Studio plan',
      'Unlimited stylist accounts',
      'Inventory management',
      'Multiple locations',
      'Advanced analytics',
      'Staff performance tracking',
      'Customer loyalty program',
      'Priority support'
    ]
  }
];

export default {
  API_URL,
  ENABLE_MOCK_API,
  ENABLE_GOOGLE_LOGIN,
  ENABLE_FACEBOOK_LOGIN,
  APP_NAME,
  APP_VERSION,
  STORAGE_KEYS,
  DEFAULT_PLANS
}; 