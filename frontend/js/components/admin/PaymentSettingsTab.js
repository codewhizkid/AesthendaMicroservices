import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../../context/AdminContext';

const PaymentSettingsTab = () => {
  const { state, actions, showAlert } = useAdminContext();
  const { isLoading } = state;

  // State for payment provider configuration
  const [paymentConfig, setPaymentConfig] = useState({
    isEnabled: false,
    activeProvider: 'stripe',
    environment: 'sandbox',
    stripe: {
      publicKey: '',
      secretKey: '',
    },
    square: {
      applicationId: '',
      locationId: '',
      accessToken: '',
    },
    paypal: {
      clientId: '',
      clientSecret: '',
      merchantId: '',
    },
    settings: {
      currency: 'usd',
      serviceFee: 0,
      serviceFeeType: 'percentage',
      taxRate: 0,
      applyTaxes: false,
      capturePaymentsAutomatically: true,
    }
  });

  // State for connection test
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // State for save button
  const [isSaving, setIsSaving] = useState(false);

  // Load payment configuration on component mount
  useEffect(() => {
    loadPaymentConfig();
  }, []);

  // Load payment configuration from the server
  const loadPaymentConfig = async () => {
    try {
      // Mock API call - replace with actual API call when ready
      const tenantId = localStorage.getItem('tenantId') || 'tenant123';
      const response = await fetch(`/api/tenants/${tenantId}/payment-config`);
      
      if (!response.ok) {
        throw new Error('Failed to load payment configuration');
      }
      
      const data = await response.json();
      setPaymentConfig(data);
    } catch (error) {
      console.error('Error loading payment config:', error);
      showAlert(`Error loading payment configuration: ${error.message}`, 'error');
    }
  };

  // Handle change in form fields
  const handleChange = (section, field, value) => {
    if (section === 'root') {
      setPaymentConfig(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setPaymentConfig(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    }
  };

  // Test connection to payment provider
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionStatus(null);
      
      // Mock API call - replace with actual API call when ready
      const tenantId = localStorage.getItem('tenantId') || 'tenant123';
      const response = await fetch(`/api/tenants/${tenantId}/payment-config/validate`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Connection test failed');
      }
      
      const result = await response.json();
      
      setConnectionStatus({
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        showAlert('Connection test successful!', 'success');
      } else {
        showAlert(`Connection test failed: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setConnectionStatus({
        success: false,
        message: error.message
      });
      showAlert(`Error testing connection: ${error.message}`, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  // Save payment configuration
  const savePaymentConfig = async (e) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Mock API call - replace with actual API call when ready
      const tenantId = localStorage.getItem('tenantId') || 'tenant123';
      const response = await fetch(`/api/tenants/${tenantId}/payment-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentConfig)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save payment configuration');
      }
      
      showAlert('Payment configuration saved successfully', 'success');
    } catch (error) {
      console.error('Error saving payment config:', error);
      showAlert(`Error saving payment configuration: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Currency options
  const currencies = [
    { code: 'usd', name: 'US Dollar (USD)' },
    { code: 'eur', name: 'Euro (EUR)' },
    { code: 'gbp', name: 'British Pound (GBP)' },
    { code: 'cad', name: 'Canadian Dollar (CAD)' },
    { code: 'aud', name: 'Australian Dollar (AUD)' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-serif font-bold text-spa-dark">Payment Settings</h2>
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spa-olive"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-spa-dark">Payment Settings</h2>
      <p className="text-spa-brown">Configure your payment providers and settings for online booking.</p>
      
      <form onSubmit={savePaymentConfig}>
        {/* General Payment Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium text-spa-dark mb-4">General Payment Settings</h3>
          <p className="text-sm text-spa-brown mb-6">Configure basic payment settings for your salon.</p>
          
          <div className="flex items-center space-x-2 mb-6">
            <input 
              type="checkbox" 
              id="isEnabled"
              checked={paymentConfig.isEnabled}
              onChange={(e) => handleChange('root', 'isEnabled', e.target.checked)}
              className="rounded text-spa-olive focus:ring-spa-olive"
            />
            <label htmlFor="isEnabled" className="text-spa-dark font-medium">
              Enable Online Payments
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-spa-dark mb-1">Payment Environment</label>
              <select
                value={paymentConfig.environment}
                onChange={(e) => handleChange('root', 'environment', e.target.value)}
                className="w-full p-2 border border-spa-beige rounded-md"
                disabled={!paymentConfig.isEnabled}
              >
                <option value="sandbox">Sandbox/Test</option>
                <option value="production">Production/Live</option>
              </select>
              <p className="text-xs text-spa-brown mt-1">
                Use sandbox for testing, switch to production for live payments.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-spa-dark mb-1">Currency</label>
              <select
                value={paymentConfig.settings.currency}
                onChange={(e) => handleChange('settings', 'currency', e.target.value)}
                className="w-full p-2 border border-spa-beige rounded-md"
                disabled={!paymentConfig.isEnabled}
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-spa-dark mb-1">Service Fee</label>
              <div className="flex items-center">
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={paymentConfig.settings.serviceFee}
                  onChange={(e) => handleChange('settings', 'serviceFee', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-spa-beige rounded-md rounded-r-none"
                  disabled={!paymentConfig.isEnabled}
                />
                <select
                  value={paymentConfig.settings.serviceFeeType}
                  onChange={(e) => handleChange('settings', 'serviceFeeType', e.target.value)}
                  className="p-2 border border-spa-beige border-l-0 rounded-md rounded-l-none"
                  disabled={!paymentConfig.isEnabled}
                >
                  <option value="percentage">%</option>
                  <option value="flat">Flat</option>
                </select>
              </div>
              <p className="text-xs text-spa-brown mt-1">
                Optional fee added to customer payments.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-spa-dark mb-1">Tax Rate (%)</label>
              <div className="flex items-center">
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={paymentConfig.settings.taxRate}
                  onChange={(e) => handleChange('settings', 'taxRate', parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-spa-beige rounded-md"
                  disabled={!paymentConfig.isEnabled || !paymentConfig.settings.applyTaxes}
                />
              </div>
              <div className="mt-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={paymentConfig.settings.applyTaxes}
                    onChange={(e) => handleChange('settings', 'applyTaxes', e.target.checked)}
                    className="rounded text-spa-olive focus:ring-spa-olive mr-2"
                    disabled={!paymentConfig.isEnabled}
                  />
                  <span className="text-sm text-spa-dark">Apply taxes to bookings</span>
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={paymentConfig.settings.capturePaymentsAutomatically}
                onChange={(e) => handleChange('settings', 'capturePaymentsAutomatically', e.target.checked)}
                className="rounded text-spa-olive focus:ring-spa-olive mr-2"
                disabled={!paymentConfig.isEnabled}
              />
              <span className="text-sm text-spa-dark">Capture payments automatically</span>
            </label>
            <p className="text-xs text-spa-brown mt-1 ml-6">
              If disabled, payments will require manual capture through the dashboard.
            </p>
          </div>
        </div>
        
        {/* Payment Provider Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium text-spa-dark mb-4">Payment Provider</h3>
          <p className="text-sm text-spa-brown mb-6">Select and configure your preferred payment provider.</p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-spa-dark mb-3">Active Payment Provider</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className={`
                border rounded-lg p-4 flex items-center space-x-3 cursor-pointer transition-colors
                ${paymentConfig.activeProvider === 'stripe' 
                  ? 'border-spa-olive bg-spa-nude-50' 
                  : 'border-spa-beige hover:border-spa-olive'}
              `}>
                <input 
                  type="radio" 
                  name="paymentProvider"
                  value="stripe"
                  checked={paymentConfig.activeProvider === 'stripe'}
                  onChange={(e) => handleChange('root', 'activeProvider', e.target.value)}
                  className="text-spa-olive focus:ring-spa-olive"
                  disabled={!paymentConfig.isEnabled}
                />
                <span className="text-spa-dark">Stripe</span>
              </label>
              
              <label className={`
                border rounded-lg p-4 flex items-center space-x-3 cursor-pointer transition-colors
                ${paymentConfig.activeProvider === 'square' 
                  ? 'border-spa-olive bg-spa-nude-50' 
                  : 'border-spa-beige hover:border-spa-olive'}
              `}>
                <input 
                  type="radio" 
                  name="paymentProvider"
                  value="square"
                  checked={paymentConfig.activeProvider === 'square'}
                  onChange={(e) => handleChange('root', 'activeProvider', e.target.value)}
                  className="text-spa-olive focus:ring-spa-olive"
                  disabled={!paymentConfig.isEnabled}
                />
                <span className="text-spa-dark">Square</span>
              </label>
              
              <label className={`
                border rounded-lg p-4 flex items-center space-x-3 cursor-pointer transition-colors
                ${paymentConfig.activeProvider === 'paypal' 
                  ? 'border-spa-olive bg-spa-nude-50' 
                  : 'border-spa-beige hover:border-spa-olive'}
              `}>
                <input 
                  type="radio" 
                  name="paymentProvider"
                  value="paypal"
                  checked={paymentConfig.activeProvider === 'paypal'}
                  onChange={(e) => handleChange('root', 'activeProvider', e.target.value)}
                  className="text-spa-olive focus:ring-spa-olive"
                  disabled={!paymentConfig.isEnabled}
                />
                <span className="text-spa-dark">PayPal</span>
              </label>
            </div>
          </div>
          
          {/* Stripe Configuration */}
          {paymentConfig.activeProvider === 'stripe' && (
            <div className="mb-6 border-t border-spa-beige pt-6">
              <h4 className="text-md font-medium text-spa-dark mb-4">Stripe Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-spa-dark mb-1">Public Key</label>
                  <input 
                    type="text" 
                    value={paymentConfig.stripe.publicKey}
                    onChange={(e) => handleChange('stripe', 'publicKey', e.target.value)}
                    className="w-full p-2 border border-spa-beige rounded-md"
                    placeholder={paymentConfig.environment === 'sandbox' ? 'pk_test_...' : 'pk_live_...'}
                    disabled={!paymentConfig.isEnabled}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-spa-dark mb-1">Secret Key</label>
                  <input 
                    type="password" 
                    value={paymentConfig.stripe.secretKey}
                    onChange={(e) => handleChange('stripe', 'secretKey', e.target.value)}
                    className="w-full p-2 border border-spa-beige rounded-md"
                    placeholder={paymentConfig.environment === 'sandbox' ? 'sk_test_...' : 'sk_live_...'}
                    disabled={!paymentConfig.isEnabled}
                  />
                </div>
              </div>
              
              <p className="text-sm text-spa-brown mb-4">
                You can find your API keys in your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-spa-olive hover:underline">Stripe Dashboard</a>.
              </p>
            </div>
          )}
          
          {/* Square Configuration */}
          {paymentConfig.activeProvider === 'square' && (
            <div className="mb-6 border-t border-spa-beige pt-6">
              <h4 className="text-md font-medium text-spa-dark mb-4">Square Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-spa-dark mb-1">Application ID</label>
                  <input 
                    type="text" 
                    value={paymentConfig.square.applicationId}
                    onChange={(e) => handleChange('square', 'applicationId', e.target.value)}
                    className="w-full p-2 border border-spa-beige rounded-md"
                    placeholder="sq0idp-..."
                    disabled={!paymentConfig.isEnabled}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-spa-dark mb-1">Location ID</label>
                  <input 
                    type="text" 
                    value={paymentConfig.square.locationId}
                    onChange={(e) => handleChange('square', 'locationId', e.target.value)}
                    className="w-full p-2 border border-spa-beige rounded-md"
                    placeholder="L..."
                    disabled={!paymentConfig.isEnabled}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-spa-dark mb-1">Access Token</label>
                <input 
                  type="password" 
                  value={paymentConfig.square.accessToken}
                  onChange={(e) => handleChange('square', 'accessToken', e.target.value)}
                  className="w-full p-2 border border-spa-beige rounded-md"
                  placeholder={paymentConfig.environment === 'sandbox' ? 'EAAAEBm...' : 'EAAAFBm...'}
                  disabled={!paymentConfig.isEnabled}
                />
              </div>
              
              <p className="text-sm text-spa-brown mb-4">
                You can find your credentials in your <a href="https://developer.squareup.com/apps" target="_blank" rel="noopener noreferrer" className="text-spa-olive hover:underline">Square Developer Dashboard</a>.
              </p>
            </div>
          )}
          
          {/* PayPal Configuration */}
          {paymentConfig.activeProvider === 'paypal' && (
            <div className="mb-6 border-t border-spa-beige pt-6">
              <h4 className="text-md font-medium text-spa-dark mb-4">PayPal Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-spa-dark mb-1">Client ID</label>
                  <input 
                    type="text" 
                    value={paymentConfig.paypal.clientId}
                    onChange={(e) => handleChange('paypal', 'clientId', e.target.value)}
                    className="w-full p-2 border border-spa-beige rounded-md"
                    disabled={!paymentConfig.isEnabled}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-spa-dark mb-1">Client Secret</label>
                  <input 
                    type="password" 
                    value={paymentConfig.paypal.clientSecret}
                    onChange={(e) => handleChange('paypal', 'clientSecret', e.target.value)}
                    className="w-full p-2 border border-spa-beige rounded-md"
                    disabled={!paymentConfig.isEnabled}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-spa-dark mb-1">Merchant ID</label>
                <input 
                  type="text" 
                  value={paymentConfig.paypal.merchantId}
                  onChange={(e) => handleChange('paypal', 'merchantId', e.target.value)}
                  className="w-full p-2 border border-spa-beige rounded-md"
                  disabled={!paymentConfig.isEnabled}
                />
              </div>
              
              <p className="text-sm text-spa-brown mb-4">
                You can find your credentials in your <a href="https://developer.paypal.com/dashboard/" target="_blank" rel="noopener noreferrer" className="text-spa-olive hover:underline">PayPal Developer Dashboard</a>.
              </p>
            </div>
          )}
        </div>
        
        {/* Test Connection */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-medium text-spa-dark mb-4">Test Connection</h3>
          <p className="text-sm text-spa-brown mb-6">Verify your payment provider connection before going live.</p>
          
          <button 
            type="button"
            onClick={testConnection}
            disabled={!paymentConfig.isEnabled || testingConnection}
            className="bg-spa-olive hover:bg-spa-olive-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testingConnection ? 'Testing...' : 'Test Connection'}
          </button>
          
          {connectionStatus && (
            <div className={`mt-4 p-4 rounded-md ${connectionStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex">
                {connectionStatus.success ? (
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <p>{connectionStatus.message}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            type="submit"
            disabled={isSaving}
            className="bg-spa-olive hover:bg-spa-olive-600 text-white py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Payment Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentSettingsTab; 