const SUBSCRIPTION_PLANS = ['BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'];
const BILLING_CYCLES = ['MONTHLY', 'QUARTERLY', 'ANNUAL'];

const validateSubscriptionSettings = (settings) => {
  const errors = [];
  
  if (!settings || typeof settings !== 'object') {
    errors.push('Subscription settings must be an object');
    return errors;
  }

  // Validate plan
  if (!settings.plan || !SUBSCRIPTION_PLANS.includes(settings.plan)) {
    errors.push('Invalid subscription plan');
  }

  // Validate billing cycle
  if (!settings.billingCycle || !BILLING_CYCLES.includes(settings.billingCycle)) {
    errors.push('Invalid billing cycle');
  }

  // Validate custom features (if present)
  if (settings.customFeatures !== undefined) {
    if (!Array.isArray(settings.customFeatures)) {
      errors.push('Custom features must be an array');
    } else {
      settings.customFeatures.forEach((feature, index) => {
        if (typeof feature !== 'string' || feature.length === 0) {
          errors.push(`Invalid custom feature at index ${index}`);
        }
      });
    }
  }

  return errors;
};

const validateBillingSettings = (settings) => {
  const errors = [];
  
  if (!settings || typeof settings !== 'object') {
    errors.push('Billing settings must be an object');
    return errors;
  }

  // Validate company name
  if (!settings.companyName || typeof settings.companyName !== 'string' || settings.companyName.length === 0) {
    errors.push('Company name is required and must be a non-empty string');
  }

  // Validate tax ID (if present)
  if (settings.taxId !== undefined && 
      (typeof settings.taxId !== 'string' || settings.taxId.length === 0)) {
    errors.push('Tax ID must be a non-empty string if provided');
  }

  // Validate billing email
  if (!settings.billingEmail || typeof settings.billingEmail !== 'string') {
    errors.push('Billing email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.billingEmail)) {
      errors.push('Invalid billing email format');
    }
  }

  // Validate billing address
  if (!settings.billingAddress || typeof settings.billingAddress !== 'object') {
    errors.push('Billing address is required');
  } else {
    const addressErrors = validateAddress(settings.billingAddress);
    errors.push(...addressErrors.map(error => `Billing address: ${error}`));
  }

  // Validate auto-renew flag
  if (settings.autoRenew !== undefined && typeof settings.autoRenew !== 'boolean') {
    errors.push('Auto-renew must be a boolean value');
  }

  return errors;
};

const validatePaymentGatewaySettings = (settings) => {
  const errors = [];
  const VALID_GATEWAYS = ['STRIPE', 'SQUARE', 'PAYPAL'];
  const VALID_ENVIRONMENTS = ['sandbox', 'production'];
  
  if (!settings || typeof settings !== 'object') {
    errors.push('Payment gateway settings must be an object');
    return errors;
  }

  // Validate gateway type
  if (!settings.gateway || !VALID_GATEWAYS.includes(settings.gateway)) {
    errors.push('Invalid payment gateway');
  }

  // Validate enabled status
  if (typeof settings.isEnabled !== 'boolean') {
    errors.push('Enabled status must be a boolean');
  }

  // Validate credentials
  if (!settings.credentials || typeof settings.credentials !== 'object') {
    errors.push('Gateway credentials are required');
  } else {
    // Validate environment
    if (!settings.credentials.environment || 
        !VALID_ENVIRONMENTS.includes(settings.credentials.environment)) {
      errors.push('Invalid gateway environment');
    }

    // Validate API key (if required)
    if (settings.gateway !== 'PAYPAL' && 
        (!settings.credentials.apiKey || 
         typeof settings.credentials.apiKey !== 'string' || 
         settings.credentials.apiKey.length === 0)) {
      errors.push('API key is required for this gateway');
    }

    // Validate merchant ID (if required)
    if (settings.gateway === 'SQUARE' && 
        (!settings.credentials.merchantId || 
         typeof settings.credentials.merchantId !== 'string' || 
         settings.credentials.merchantId.length === 0)) {
      errors.push('Merchant ID is required for Square');
    }
  }

  // Validate webhook URL (if present)
  if (settings.webhookUrl !== undefined) {
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
    if (!urlRegex.test(settings.webhookUrl)) {
      errors.push('Invalid webhook URL format');
    }
  }

  return errors;
};

const validateAddress = (address) => {
  const errors = [];

  if (!address.street || typeof address.street !== 'string' || address.street.length === 0) {
    errors.push('Street address is required');
  }

  if (!address.city || typeof address.city !== 'string' || address.city.length === 0) {
    errors.push('City is required');
  }

  if (!address.state || typeof address.state !== 'string' || address.state.length === 0) {
    errors.push('State/Province is required');
  }

  if (!address.postalCode || typeof address.postalCode !== 'string' || address.postalCode.length === 0) {
    errors.push('Postal code is required');
  }

  if (!address.country || typeof address.country !== 'string' || address.country.length === 0) {
    errors.push('Country is required');
  }

  return errors;
};

module.exports = {
  validateSubscriptionSettings,
  validateBillingSettings,
  validatePaymentGatewaySettings
}; 