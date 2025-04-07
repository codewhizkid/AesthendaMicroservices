import React, { useState } from 'react';
import { format } from 'date-fns';
import { componentClasses, commonStyles } from '../../theme';

const AppointmentDetails = ({ isOpen, onClose, appointment, onUpdate, onDelete }) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  if (!isOpen || !appointment) return null;
  
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(appointment.id);
      onClose();
    } catch (error) {
      console.error('Error deleting appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await onUpdate({
        ...appointment,
        status: 'cancelled'
      });
      onClose();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className={componentClasses.modal.overlay}>
      <div className={componentClasses.modal.content}>
        <div className={componentClasses.modal.header}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Appointment Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className={componentClasses.modal.body}>
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex justify-between items-center">
              <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </span>
              <span className="text-sm text-gray-500">
                ID: {appointment.id}
              </span>
            </div>
            
            {/* Date and Time */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
              <p className="mt-1 text-sm">
                {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
                <br />
                {appointment.startTime} ({appointment.duration} minutes)
              </p>
            </div>
            
            {/* Client Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Client</h3>
              <p className="mt-1 text-sm">
                {appointment.client?.firstName} {appointment.client?.lastName}
                <br />
                {appointment.client?.email}
                {appointment.client?.phone && (
                  <>
                    <br />
                    {appointment.client.phone}
                  </>
                )}
              </p>
            </div>
            
            {/* Stylist Information */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Stylist</h3>
              <p className="mt-1 text-sm">
                {appointment.stylist?.firstName} {appointment.stylist?.lastName}
              </p>
            </div>
            
            {/* Services */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Services</h3>
              <ul className="mt-1 space-y-1">
                {appointment.services?.map((service, index) => (
                  <li key={index} className="text-sm flex justify-between">
                    <span>{service.name}</span>
                    <span>${service.price}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 pt-2 border-t text-sm flex justify-between font-medium">
                <span>Total</span>
                <span>${appointment.totalPrice}</span>
              </div>
            </div>
            
            {/* Notes */}
            {appointment.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1 text-sm text-gray-700">
                  {appointment.notes}
                </p>
              </div>
            )}
            
            {/* Cancellation Details */}
            {appointment.status === 'cancelled' && appointment.cancellationReason && (
              <div className="bg-red-50 p-3 rounded-md">
                <h3 className="text-sm font-medium text-red-800">Cancellation Details</h3>
                <p className="mt-1 text-sm text-red-700">
                  {appointment.cancellationReason}
                </p>
                {appointment.cancellationDate && (
                  <p className="mt-1 text-sm text-red-600">
                    Cancelled on {format(new Date(appointment.cancellationDate), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className={componentClasses.modal.footer}>
          {isConfirmingDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-center text-gray-600">
                Are you sure you want to delete this appointment? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  className={`${commonStyles.button.base} ${commonStyles.button.outline}`}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`${commonStyles.button.base} bg-red-600 text-white hover:bg-red-700`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className={`${commonStyles.button.base} text-red-600 hover:text-red-700`}
                disabled={isLoading}
              >
                Delete
              </button>
              {appointment.status === 'scheduled' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className={`${commonStyles.button.base} ${commonStyles.button.outline}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`${commonStyles.button.base} ${commonStyles.button.primary}`}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails; 