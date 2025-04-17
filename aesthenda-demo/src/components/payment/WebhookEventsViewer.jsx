import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';

// Status badge component to show different colors based on status
const StatusBadge = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'invalid_signature':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {status}
    </span>
  );
};

// Provider badge component to show different colors based on provider
const ProviderBadge = ({ provider }) => {
  const getProviderColor = () => {
    switch (provider) {
      case 'stripe':
        return 'bg-purple-100 text-purple-800';
      case 'square':
        return 'bg-blue-100 text-blue-800';
      case 'paypal':
        return 'bg-indigo-100 text-indigo-800';
      case 'test':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProviderColor()}`}>
      {provider}
    </span>
  );
};

const WebhookEventsViewer = () => {
  // State for webhook events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for selected event details
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState({
    statusCounts: {},
    providerCounts: {},
    total: 0
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    provider: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Get tenant ID from localStorage
  const tenantId = localStorage.getItem('tenantId') || 'tenant123';
  
  // Function to fetch webhook events with filters
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { page, limit } = pagination;
      
      // Construct query parameters
      const params = new URLSearchParams({
        tenantId,
        page,
        limit,
        ...filters
      });
      
      // Remove empty filter values
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          params.delete(key);
        }
      });
      
      const response = await axios.get(`/api/webhook-events?${params.toString()}`);
      
      setEvents(response.data.data);
      setPagination({
        ...pagination,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      });
    } catch (err) {
      console.error('Error fetching webhook events:', err);
      setError('Failed to load webhook events. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch statistics
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams({
        tenantId,
        ...filters
      });
      
      // Remove empty filter values
      Object.keys(filters).forEach(key => {
        if (!filters[key]) {
          params.delete(key);
        }
      });
      
      const response = await axios.get(`/api/webhook-events/stats?${params.toString()}`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching webhook event stats:', err);
    }
  };
  
  // Load events on component mount and when filters or pagination change
  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [pagination.page, pagination.limit, filters]);
  
  // Function to load event details
  const loadEventDetails = async (eventId) => {
    if (selectedEvent && selectedEvent._id === eventId) {
      // Toggle off if already selected
      setSelectedEvent(null);
      return;
    }
    
    setDetailsLoading(true);
    
    try {
      const response = await axios.get(`/api/webhook-events/${eventId}?tenantId=${tenantId}`);
      setSelectedEvent(response.data);
    } catch (err) {
      console.error('Error fetching webhook event details:', err);
      setError('Failed to load event details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };
  
  // Function to retry a failed webhook
  const retryWebhook = async (eventId) => {
    try {
      const response = await axios.post(`/api/webhook-events/${eventId}/retry`, { tenantId });
      
      // Update the event in the list
      setEvents(events.map(event => 
        event._id === eventId ? response.data.event : event
      ));
      
      // Update the selected event if it's currently selected
      if (selectedEvent && selectedEvent._id === eventId) {
        setSelectedEvent(response.data.event);
      }
      
      // Refresh stats
      fetchStats();
      
      alert('Webhook event reprocessed successfully!');
    } catch (err) {
      console.error('Error retrying webhook event:', err);
      alert(`Failed to retry webhook: ${err.response?.data?.error || err.message}`);
    }
  };
  
  // Function to handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    // Reset to first page when filters change
    setPagination({
      ...pagination,
      page: 1
    });
  };
  
  // Function to handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    
    setPagination({
      ...pagination,
      page: newPage
    });
  };
  
  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Function to format JSON for display
  const formatJSON = (json) => {
    return JSON.stringify(json, null, 2);
  };
  
  // Function to get abbreviated event type
  const getEventTypeAbbreviation = (eventType) => {
    if (!eventType) return 'unknown';
    
    const parts = eventType.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1];
    }
    return eventType;
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-medium text-spa-dark mb-4">Webhook Events</h2>
        <p className="text-spa-brown mb-6">
          Monitor and manage payment provider webhook events for troubleshooting and auditing.
        </p>
        
        {/* Stats section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-spa-nude-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-spa-dark mb-2">Total Events</h3>
            <p className="text-2xl font-bold text-spa-dark">{stats.total || 0}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800 mb-2">Processed</h3>
            <p className="text-2xl font-bold text-green-800">{stats.statusCounts?.processed || 0}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-800 mb-2">Failed</h3>
            <p className="text-2xl font-bold text-red-800">
              {(stats.statusCounts?.failed || 0) + (stats.statusCounts?.invalid_signature || 0)}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Pending</h3>
            <p className="text-2xl font-bold text-blue-800">{stats.statusCounts?.received || 0}</p>
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-spa-dark mb-1">Provider</label>
            <select
              name="provider"
              value={filters.provider}
              onChange={handleFilterChange}
              className="w-full p-2 border border-spa-beige rounded-md"
            >
              <option value="">All Providers</option>
              <option value="stripe">Stripe</option>
              <option value="square">Square</option>
              <option value="paypal">PayPal</option>
              <option value="test">Test</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-spa-dark mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-spa-beige rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="received">Received</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
              <option value="invalid_signature">Invalid Signature</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-spa-dark mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full p-2 border border-spa-beige rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-spa-dark mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full p-2 border border-spa-beige rounded-md"
            />
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Events table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spa-olive"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-spa-brown">
              No webhook events found. Try adjusting your filters.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-spa-beige">
              <thead className="bg-spa-nude-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-spa-dark uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-spa-dark uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-spa-dark uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-spa-dark uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-spa-dark uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-spa-dark uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-spa-beige">
                {events.map(event => (
                  <tr 
                    key={event._id} 
                    className={`hover:bg-spa-nude-50 cursor-pointer ${selectedEvent && selectedEvent._id === event._id ? 'bg-spa-nude-50' : ''}`}
                    onClick={() => loadEventDetails(event._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-spa-dark">
                      {formatDate(event.receivedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ProviderBadge provider={event.provider} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-spa-dark">
                      {getEventTypeAbbreviation(event.eventType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-spa-dark">
                      {event.paymentId ? event.paymentId.substring(0, 8) + '...' : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          loadEventDetails(event._id);
                        }}
                        className="text-spa-olive hover:text-spa-dark"
                      >
                        View
                      </button>
                      {(event.status === 'failed' || event.status === 'invalid_signature') && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            retryWebhook(event._id);
                          }}
                          className="ml-3 text-spa-olive hover:text-spa-dark"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination */}
        {events.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-spa-dark">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span> of <span className="font-medium">{pagination.total}</span> results
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded border border-spa-beige text-spa-dark disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 rounded border border-spa-beige text-spa-dark disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Event details panel */}
      {detailsLoading ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-spa-olive"></div>
          </div>
        </div>
      ) : selectedEvent && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-spa-dark">Event Details</h3>
            <button 
              onClick={() => setSelectedEvent(null)}
              className="text-gray-400 hover:text-spa-dark"
            >
              &times;
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm font-medium text-spa-dark">Event ID</p>
              <p className="text-sm text-spa-brown">{selectedEvent._id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-spa-dark">Provider Event ID</p>
              <p className="text-sm text-spa-brown">{selectedEvent.eventId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-spa-dark">Status</p>
              <StatusBadge status={selectedEvent.status} />
            </div>
            <div>
              <p className="text-sm font-medium text-spa-dark">Provider</p>
              <ProviderBadge provider={selectedEvent.provider} />
            </div>
            <div>
              <p className="text-sm font-medium text-spa-dark">Received At</p>
              <p className="text-sm text-spa-brown">{formatDate(selectedEvent.receivedAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-spa-dark">Processed At</p>
              <p className="text-sm text-spa-brown">{formatDate(selectedEvent.processedAt) || 'Not processed'}</p>
            </div>
            {selectedEvent.paymentId && (
              <div>
                <p className="text-sm font-medium text-spa-dark">Payment ID</p>
                <p className="text-sm text-spa-brown">{selectedEvent.paymentId}</p>
              </div>
            )}
            {selectedEvent.appointmentId && (
              <div>
                <p className="text-sm font-medium text-spa-dark">Appointment ID</p>
                <p className="text-sm text-spa-brown">{selectedEvent.appointmentId}</p>
              </div>
            )}
            {selectedEvent.customerId && (
              <div>
                <p className="text-sm font-medium text-spa-dark">Customer ID</p>
                <p className="text-sm text-spa-brown">{selectedEvent.customerId}</p>
              </div>
            )}
          </div>
          
          {selectedEvent.processingError && (
            <div className="mb-6">
              <p className="text-sm font-medium text-red-600 mb-1">Processing Error</p>
              <div className="bg-red-50 p-3 rounded border border-red-200 text-sm font-mono text-red-800">
                {selectedEvent.processingError}
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <p className="text-sm font-medium text-spa-dark mb-2">Event Payload</p>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
              <pre className="text-xs text-gray-700 font-mono">
                {formatJSON(selectedEvent.payload)}
              </pre>
            </div>
          </div>
          
          {(selectedEvent.status === 'failed' || selectedEvent.status === 'invalid_signature') && (
            <div className="flex justify-end">
              <button 
                onClick={() => retryWebhook(selectedEvent._id)}
                className="px-4 py-2 bg-spa-olive text-white rounded hover:bg-spa-dark transition-colors"
              >
                Retry Processing
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebhookEventsViewer; 