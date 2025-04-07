import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { componentClasses } from '../../theme';

const AppointmentModal = ({ isOpen, onClose, onSubmit, initialDate, appointment = null }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    stylistId: '',
    serviceIds: [],
    additionalServices: [],
    date: format(initialDate, 'yyyy-MM-dd'),
    startTime: '09:00',
    duration: 60,
    notes: '',
    status: 'scheduled'
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);
  
  useEffect(() => {
    if (appointment) {
      setFormData({
        clientId: appointment.clientId,
        stylistId: appointment.stylistId,
        serviceIds: appointment.serviceIds || [],
        additionalServices: appointment.additionalServices || [],
        date: format(new Date(appointment.date), 'yyyy-MM-dd'),
        startTime: appointment.startTime,
        duration: appointment.duration,
        notes: appointment.notes || '',
        status: appointment.status
      });
    }
    
    // Fetch clients, stylists, and services
    fetchClients();
    fetchStylists();
    fetchServices();
  }, [appointment]);
  
  const fetchClients = async () => {
    // Mock data for demonstration
    setClients([
      { id: '1', firstName: 'John', lastName: 'Doe' },
      { id: '2', firstName: 'Jane', lastName: 'Smith' }
    ]);
  };
  
  const fetchStylists = async () => {
    // Mock data for demonstration
    setStylists([
      { id: '1', firstName: 'Sarah', lastName: 'Johnson' },
      { id: '2', firstName: 'Mike', lastName: 'Wilson' }
    ]);
  };
  
  const fetchServices = async () => {
    // Mock data for demonstration
    setServices([
      { id: '1', name: 'Haircut', duration: 60, price: 50 },
      { id: '2', name: 'Color', duration: 120, price: 100 },
      { id: '3', name: 'Style', duration: 30, price: 40 }
    ]);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const isChecked = e.target.checked;
    
    setFormData(prev => ({
      ...prev,
      serviceIds: isChecked
        ? [...prev.serviceIds, serviceId]
        : prev.serviceIds.filter(id => id !== serviceId)
    }));
    
    // Update duration based on selected services
    const totalDuration = services
      .filter(service => formData.serviceIds.includes(service.id))
      .reduce((sum, service) => sum + service.duration, 0);
    
    setFormData(prev => ({
      ...prev,
      duration: totalDuration || 60 // Default to 60 minutes if no services selected
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.clientId) newErrors.clientId = 'Client is required';
    if (!formData.stylistId) newErrors.stylistId = 'Stylist is required';
    if (formData.serviceIds.length === 0) newErrors.serviceIds = 'At least one service is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting appointment:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to save appointment. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className={componentClasses.modal.overlay}>
      <div className={componentClasses.modal.content}>
        <div className={componentClasses.modal.header}>
          <h2 className="text-xl font-semibold">
            {appointment ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={componentClasses.modal.body}>
            <div className="space-y-4">
              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  className={`${commonStyles.input.base} ${errors.clientId ? commonStyles.input.error : commonStyles.input.default}`}
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
                )}
              </div>
              
              {/* Stylist Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stylist
                </label>
                <select
                  name="stylistId"
                  value={formData.stylistId}
                  onChange={handleInputChange}
                  className={`${commonStyles.input.base} ${errors.stylistId ? commonStyles.input.error : commonStyles.input.default}`}
                >
                  <option value="">Select a stylist</option>
                  {stylists.map(stylist => (
                    <option key={stylist.id} value={stylist.id}>
                      {stylist.firstName} {stylist.lastName}
                    </option>
                  ))}
                </select>
                {errors.stylistId && (
                  <p className="mt-1 text-sm text-red-600">{errors.stylistId}</p>
                )}
              </div>
              
              {/* Services Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Services
                </label>
                <div className="space-y-2">
                  {services.map(service => (
                    <label key={service.id} className="flex items-center">
                      <input
                        type="checkbox"
                        value={service.id}
                        checked={formData.serviceIds.includes(service.id)}
                        onChange={handleServiceChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {service.name} - ${service.price} ({service.duration} min)
                      </span>
                    </label>
                  ))}
                </div>
                {errors.serviceIds && (
                  <p className="mt-1 text-sm text-red-600">{errors.serviceIds}</p>
                )}
              </div>
              
              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className={`${commonStyles.input.base} ${errors.date ? commonStyles.input.error : commonStyles.input.default}`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className={`${commonStyles.input.base} ${errors.startTime ? commonStyles.input.error : commonStyles.input.default}`}
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                  )}
                </div>
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="15"
                  step="15"
                  className={commonStyles.input.default}
                  readOnly
                />
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className={commonStyles.input.default}
                  placeholder="Add any special instructions or notes..."
                />
              </div>
            </div>
          </div>
          
          <div className={componentClasses.modal.footer}>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`${commonStyles.button.base} ${commonStyles.button.outline}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`${commonStyles.button.base} ${commonStyles.button.primary}`}
              >
                {isLoading ? 'Saving...' : appointment ? 'Update' : 'Create'}
              </button>
            </div>
            {errors.submit && (
              <p className="mt-2 text-sm text-red-600 text-center">{errors.submit}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal; 