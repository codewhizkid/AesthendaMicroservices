const { getProvider } = require('../providers');

/**
 * Service for managing tenant payment configurations
 */
class TenantPaymentService {
  constructor() {
    this.initialized = false;
    this.providerInstances = new Map();
    this.tenantConfigs = new Map();
    
    // Initialize with default configurations
    this._initializeDefaults();
  }
  
  /**
   * Initialize default configurations for development/testing
   * @private
   */
  _initializeDefaults() {
    // Default tenant configurations for testing
    const defaultConfigs = {
      'tenant123': {
        tenantId: 'tenant123',
        isEnabled: true,
        activeProvider: 'stripe',
        environment: 'sandbox',
        stripe: {
          publicKey: 'pk_test_sample',
          secretKey: 'sk_test_sample'
        },
        settings: {
          currency: 'usd',
          serviceFee: 5,
          serviceFeeType: 'percentage',
          taxRate: 8.5,
          applyTaxes: true,
          capturePaymentsAutomatically: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    // Set default configurations
    Object.values(defaultConfigs).forEach(config => {
      this.tenantConfigs.set(config.tenantId, config);
    });
    
    this.initialized = true;
    console.log('Tenant payment service initialized with defaults');
  }
  
  /**
   * Get tenant payment configuration
   * @param {string} tenantId - The tenant identifier
   * @returns {Promise<Object>} - Tenant configuration
   */
  async getTenantConfig(tenantId) {
    // Check if tenant configuration exists
    const config = this.tenantConfigs.get(tenantId);
    if (!config) {
      return this._createDefaultConfig(tenantId);
    }
    
    // Return sanitized configuration (without sensitive data)
    return this._sanitizeConfig(config);
  }
  
  /**
   * Create a default configuration for a new tenant
   * @param {string} tenantId - The tenant identifier
   * @returns {Object} - Default tenant configuration
   * @private
   */
  _createDefaultConfig(tenantId) {
    const defaultConfig = {
      tenantId,
      isEnabled: false,
      activeProvider: 'mock',
      environment: 'sandbox',
      stripe: {
        publicKey: '',
        secretKey: ''
      },
      square: {
        applicationId: '',
        locationId: '',
        accessToken: ''
      },
      paypal: {
        clientId: '',
        clientSecret: '',
        merchantId: ''
      },
      settings: {
        currency: 'usd',
        serviceFee: 0,
        serviceFeeType: 'percentage',
        taxRate: 0,
        applyTaxes: false,
        capturePaymentsAutomatically: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save the default configuration
    this.tenantConfigs.set(tenantId, defaultConfig);
    
    return this._sanitizeConfig(defaultConfig);
  }
  
  /**
   * Remove sensitive data from configuration
   * @param {Object} config - Tenant configuration
   * @returns {Object} - Sanitized configuration
   * @private
   */
  _sanitizeConfig(config) {
    const sanitized = { ...config };
    
    // Remove sensitive keys
    if (sanitized.stripe) {
      sanitized.stripe = { ...sanitized.stripe, secretKey: undefined };
    }
    
    if (sanitized.square) {
      sanitized.square = { ...sanitized.square, accessToken: undefined };
    }
    
    if (sanitized.paypal) {
      sanitized.paypal = { ...sanitized.paypal, clientSecret: undefined };
    }
    
    return sanitized;
  }
  
  /**
   * Update tenant payment configuration
   * @param {string} tenantId - The tenant identifier
   * @param {Object} updatedConfig - Updated configuration
   * @param {string} userId - User making the update
   * @returns {Promise<Object>} - Updated tenant configuration
   */
  async updateTenantConfig(tenantId, updatedConfig, userId) {
    // Get existing configuration or create default
    const existingConfig = this.tenantConfigs.get(tenantId) || 
      this._createDefaultConfig(tenantId);
    
    // Update the configuration
    const newConfig = {
      ...existingConfig,
      ...updatedConfig,
      tenantId, // Ensure tenantId can't be changed
      updatedAt: new Date(),
      updatedBy: userId
    };
    
    // Make sure nested objects are merged properly
    if (updatedConfig.settings) {
      newConfig.settings = {
        ...existingConfig.settings,
        ...updatedConfig.settings
      };
    }
    
    if (updatedConfig.stripe) {
      newConfig.stripe = {
        ...existingConfig.stripe,
        ...updatedConfig.stripe
      };
    }
    
    if (updatedConfig.square) {
      newConfig.square = {
        ...existingConfig.square,
        ...updatedConfig.square
      };
    }
    
    if (updatedConfig.paypal) {
      newConfig.paypal = {
        ...existingConfig.paypal,
        ...updatedConfig.paypal
      };
    }
    
    // Save the updated configuration
    this.tenantConfigs.set(tenantId, newConfig);
    
    // Clear any cached provider instances for this tenant
    this.providerInstances.delete(tenantId);
    
    console.log(`Updated payment configuration for tenant ${tenantId}`);
    
    // Return sanitized configuration
    return this._sanitizeConfig(newConfig);
  }
  
  /**
   * Validate tenant payment configuration by testing connection
   * @param {string} tenantId - The tenant identifier
   * @returns {Promise<Object>} - Validation result
   */
  async validateTenantConfig(tenantId) {
    // Get tenant configuration
    const config = this.tenantConfigs.get(tenantId);
    if (!config) {
      throw new Error(`No configuration found for tenant ${tenantId}`);
    }
    
    // Skip validation for mock provider
    if (config.activeProvider === 'mock') {
      return { success: true, message: 'Mock provider does not require validation' };
    }
    
    try {
      // Get provider and validate credentials
      const provider = await this._getProviderForConfig(config);
      
      // Test connection with appropriate credentials
      let credentials;
      switch (config.activeProvider) {
        case 'stripe':
          credentials = { apiKey: config.stripe.secretKey };
          break;
        case 'square':
          credentials = { 
            accessToken: config.square.accessToken,
            locationId: config.square.locationId 
          };
          break;
        case 'paypal':
          credentials = { 
            clientId: config.paypal.clientId,
            clientSecret: config.paypal.clientSecret,
            environment: config.environment
          };
          break;
        default:
          throw new Error(`Unsupported provider: ${config.activeProvider}`);
      }
      
      // Test the connection
      const result = await provider.testConnection(credentials);
      return result;
      
    } catch (error) {
      console.error(`Validation failed for tenant ${tenantId}:`, error);
      return { 
        success: false, 
        message: error.message || 'Validation failed' 
      };
    }
  }
  
  /**
   * Get payment provider for tenant
   * @param {string} tenantId - The tenant identifier
   * @returns {Promise<Object>} - Payment provider instance
   */
  async getProviderForTenant(tenantId) {
    // Get tenant configuration
    const config = this.tenantConfigs.get(tenantId);
    if (!config) {
      throw new Error(`No configuration found for tenant ${tenantId}`);
    }
    
    // Return cached provider instance if available
    if (this.providerInstances.has(tenantId)) {
      return this.providerInstances.get(tenantId);
    }
    
    // Get and initialize provider
    const provider = await this._getProviderForConfig(config);
    
    // Cache the provider instance
    this.providerInstances.set(tenantId, provider);
    
    return provider;
  }
  
  /**
   * Get provider instance for configuration
   * @param {Object} config - Tenant configuration
   * @returns {Promise<Object>} - Initialized provider instance
   * @private
   */
  async _getProviderForConfig(config) {
    try {
      // Get provider instance
      const provider = getProvider(config.activeProvider);
      
      // Configure provider with appropriate settings
      let providerConfig;
      switch (config.activeProvider) {
        case 'stripe':
          providerConfig = { 
            apiKey: config.stripe.secretKey,
            publicKey: config.stripe.publicKey,
            environment: config.environment
          };
          break;
        case 'square':
          providerConfig = {
            accessToken: config.square.accessToken,
            locationId: config.square.locationId,
            applicationId: config.square.applicationId,
            environment: config.environment
          };
          break;
        case 'paypal':
          providerConfig = {
            clientId: config.paypal.clientId,
            clientSecret: config.paypal.clientSecret,
            merchantId: config.paypal.merchantId,
            environment: config.environment
          };
          break;
        default:
          providerConfig = { environment: config.environment };
      }
      
      // Initialize the provider
      await provider.initialize(providerConfig);
      
      return provider;
    } catch (error) {
      console.error('Failed to initialize payment provider:', error);
      throw new Error(`Failed to initialize payment provider: ${error.message}`);
    }
  }

  async testProviderConnection(tenantId, provider, credentials) {
    try {
      let providerInstance;
      
      switch (provider) {
        case 'stripe':
          const { StripeProvider } = require('../providers/stripeProvider');
          providerInstance = new StripeProvider(credentials);
          break;
        case 'square':
          const { SquareProvider } = require('../providers/squareProvider');
          providerInstance = new SquareProvider(credentials);
          break;
        case 'paypal':
          const { PayPalProvider } = require('../providers/paypalProvider');
          providerInstance = new PayPalProvider(credentials);
          break;
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
      
      // Test the connection by initializing the provider
      await providerInstance.initialize();
      
      return { provider, status: 'connected' };
    } catch (error) {
      console.error(`Connection test failed for tenant ${tenantId} with provider ${provider}:`, error);
      throw new Error(`Failed to connect to ${provider}: ${error.message}`);
    }
  }
}

module.exports = new TenantPaymentService(); 