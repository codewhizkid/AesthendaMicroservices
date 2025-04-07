import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import moment from 'moment';
import { 
  GET_SERVICES, 
  GET_STYLISTS, 
  GET_AVAILABLE_TIME_SLOTS,
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
  CANCEL_APPOINTMENT 
} from '../../graphql/appointments';
import { useTenant } from '../../hooks/useTenant';
import LoadingSpinner from '../common/LoadingSpinner';

const AppointmentModal = ({ appointment, onClose, onSuccess }) => {
  const { tenantId } = useTenant();
  const isEdit = Boolean(appointment?.id);
  
  const [formData, setFormData] = useState({
    clientFirstName: appointment?.resource?.client?.firstName || '',
    clientLastName: appointment?.resource?.client?.lastName || '',
    clientEmail: appointment?.resource?.client?.email || '',
    clientPhone: appointment?.resource?.client?.phone || '',
    selectedServices: appointment?.resource?.services?.map(s => s.id) || [],
    selectedStylist: appointment?.resource?.stylist?.id || '',
    selectedDate: appointment?.startTime ? moment(appointment.startTime).format('YYYY-MM-DD') : '',
    selectedTime: appointment?.startTime ? moment(appointment.startTime).format('HH:mm') : '',
    notes: appointment?.resource?.notes || ''
  });

  // Fetch services
  const { data: servicesData, loading: servicesLoading } = useQuery(GET_SERVICES, {
    variables: { tenantId }
  });

  // Fetch stylists
  const { data: stylistsData, loading: stylistsLoading } = useQuery(GET_STYLISTS, {
    variables: { tenantId }
  });

  // Fetch available time slots
  const { data: slotsData, loading: slotsLoading } = useQuery(GET_AVAILABLE_TIME_SLOTS, {
    variables: {
      tenantId,
      date: formData.selectedDate,
      serviceIds: formData.selectedServices,
      stylistId: formData.selectedStylist
    },
    skip: !formData.selectedDate || !formData.selectedServices.length
  });

  // Mutations
  const [createAppointment] = useMutation(CREATE_APPOINTMENT);
  const [updateAppointment] = useMutation(UPDATE_APPOINTMENT);
  const [cancelAppointment] = useMutation(CANCEL_APPOINTMENT);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const appointmentInput = {
        client: {
          firstName: formData.clientFirstName,
          lastName: formData.clientLastName,
          email: formData.clientEmail,
          phone: formData.clientPhone
        },
        serviceIds: formData.selectedServices,
        stylistId: formData.selectedStylist,
        date: formData.selectedDate,
        startTime: formData.selectedTime,
        notes: formData.notes
      };

      if (isEdit) {
        await updateAppointment({
          variables: {
            id: appointment.id,
            input: appointmentInput
          }
        });
      } else {
        await createAppointment({
          variables: {
            tenantId,
            input: appointmentInput
          }
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleCancel = async () => {
    if (isEdit) {
      try {
        await cancelAppointment({
          variables: {
            id: appointment.id,
            reason: 'Cancelled by user'
          }
        });
        onSuccess();
      } catch (error) {
        console.error('Error cancelling appointment:', error);
      }
    }
  };

  if (servicesLoading || stylistsLoading) return <LoadingSpinner />;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">
          {isEdit ? 'Edit Appointment' : 'New Appointment'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="clientFirstName"
                value={formData.clientFirstName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="clientLastName"
                value={formData.clientLastName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Services Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
            <div className="grid grid-cols-2 gap-2">
              {servicesData?.services?.map(service => (
                <label key={service.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.selectedServices.includes(service.id)}
                    onChange={() => handleServiceChange(service.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span>{service.name} - ${service.price}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stylist Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Stylist</label>
            <select
              name="selectedStylist"
              value={formData.selectedStylist}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              required
            >
              <option value="">Select a stylist</option>
              {stylistsData?.stylists?.map(stylist => (
                <option key={stylist.id} value={stylist.id}>
                  {stylist.firstName} {stylist.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="selectedDate"
                value={formData.selectedDate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <select
                name="selectedTime"
                value={formData.selectedTime}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
                disabled={slotsLoading || !slotsData?.availableTimeSlots?.length}
              >
                <option value="">Select a time</option>
                {slotsData?.availableTimeSlots?.map(slot => (
                  <option key={slot} value={slot}>
                    {moment(slot, 'HH:mm').format('h:mm A')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50"
              >
                Cancel Appointment
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              {isEdit ? 'Update' : 'Create'} Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal; 