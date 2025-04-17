import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TestWebhookGenerator = () => {
  // State for form fields
  const [provider, setProvider] = useState('stripe');
  const [eventType, setEventType] = useState('');
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // State for available options
  const [options, setOptions] = useState({
    providers: [],
    eventTypes: {},
    statuses: {}
  });
  
  // Get tenant ID from localStorage
  const tenantId = localStorage.getItem('tenantId') || 'tenant123';
  
  // Check if in development environment
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Fetch webhook options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await axios.get('/api/test-webhooks/options');
        setOptions(response.data);
        
        // Set default values from options
        if (response.data.providers.length > 0) {
          setProvider(response.data.providers[0]);
        }
        
        if (response.data.eventTypes[response.data.providers[0]]?.length > 0) {
          setEventType(response.data.eventTypes[response.data.providers[0]][0].value);
        }
        
        if (response.data.statuses[response.data.providers[0]]?.length > 0) {
          setStatus(response.data.statuses[response.data.providers[0]][0].value);
        }
      } catch (err) {
        console.error('Failed to fetch webhook options:', err);
        setError('Failed to load test options. This feature is only available in development mode.');
      }
    };
    
    if (isDevelopment) {
      fetchOptions();
    }
  }, [isDevelopment]);
  
  // Handle provider change
  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    
    // Reset event type and status based on the new provider
    if (options.eventTypes[newProvider]?.length > 0) {
      setEventType(options.eventTypes[newProvider][0].value);
    } else {
      setEventType('');
    }
    
    if (options.statuses[newProvider]?.length > 0) {
      setStatus(options.statuses[newProvider][0].value);
    } else {
      setStatus('');
    }
  };
  
  // Generate test webhook
  const generateTestWebhook = async (e) => {
    e.preventDefault();
    
    if (!isDevelopment) {
      setError('Test webhooks can only be generated in development mode.');
      return;
    }
    
    setGenerating(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.post(`/api/test-webhooks/${provider}`, {
        tenantId,
        eventType,
        status
      });
      
      setResult(response.data);
    } catch (err) {
      console.error('Error generating test webhook:', err);
      setError(`Failed to generate test webhook: ${err.response?.data?.error || err.message}`);
    } finally {
      setGenerating(false);
    }
  };
  
  // If not in development, don't show the component
  if (!isDevelopment) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 p-6 rounded-lg shadow-md mb-6 border border-yellow-200">
      <h3 className="text-lg font-medium text-yellow-800 mb-2">Test Webhook Generator</h3>
      <p className="text-sm text-yellow-700 mb-4">
        This tool allows you to generate test webhook events for payment providers in development environments.
        These events will be processed like real webhooks and appear in the event log.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {result && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">{result.message}</p>
          <p className="text-sm">Event ID: {result.event.id}</p>
          <p className="text-sm">Type: {result.event.type}</p>
          <p className="text-sm">Status: {result.event.status}</p>
        </div>
      )}
      
      <form onSubmit={generateTestWebhook} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-spa-dark mb-1">Payment Provider</label>
          <select
            value={provider}
            onChange={handleProviderChange}
            className="w-full p-2 border border-spa-beige rounded-md"
            disabled={generating}
          >
            {options.providers.map(p => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-spa-dark mb-1">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full p-2 border border-spa-beige rounded-md"
            disabled={generating}
          >
            {options.eventTypes[provider]?.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        {options.statuses[provider] && (
          <div>
            <label className="block text-sm font-medium text-spa-dark mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-spa-beige rounded-md"
              disabled={generating}
            >
              {options.statuses[provider]?.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Test Webhook'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TestWebhookGenerator; 