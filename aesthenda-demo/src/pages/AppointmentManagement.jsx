import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import AppointmentCalendar from '../components/Calendar/AppointmentCalendar';
import appointmentService from '../api/appointmentService';
import Toast, { ToastTypes } from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ENABLE_MOCK_API } from '../config';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const { tenantData } = useTenant();
  const { currentUser } = useAuth();

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  // Fetch appointments from API or mock data
  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      if (ENABLE_MOCK_API) {
        // Use mock data
        setTimeout(() => {
          setAppointments(tenantData?.appointments || []);
          setLoading(false);
        }, 500);
      } else {
        // Use real API
        const filters = {};
        
        // Apply filters based on user role
        if (currentUser.role === 'stylist') {
          filters.stylistId = currentUser.id;
        }
        
        const result = await appointmentService.getAppointments(
          tenantData.id,
          filters,
          1,
          100
        );

        if (result.success) {
          setAppointments(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch appointments');
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Could not load appointments. Please try again later.');
      showToast(error.message || 'Failed to load appointments', ToastTypes.ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new appointment
  const handleAddAppointment = async (appointmentData) => {
    try {
      if (ENABLE_MOCK_API) {
        // Use mock data - just add to state for demo
        const newAppointment = {
          id: Date.now().toString(),
          ...appointmentData,
          status: 'scheduled',
        };
        
        setAppointments([...appointments, newAppointment]);
        showToast('Appointment created successfully', ToastTypes.SUCCESS);
        return;
      }
      
      // Use real API
      const result = await appointmentService.createAppointment({
        tenantId: tenantData.id,
        ...appointmentData,
      });
      
      if (result.success) {
        setAppointments([...appointments, result.data]);
        showToast('Appointment created successfully', ToastTypes.SUCCESS);
      } else {
        throw new Error(result.error || 'Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      showToast(error.message || 'Failed to create appointment', ToastTypes.ERROR);
    }
  };

  // Handle updating an existing appointment
  const handleUpdateAppointment = async (appointmentData) => {
    try {
      if (ENABLE_MOCK_API) {
        // Update in local state for demo
        const updatedAppointments = appointments.map(appointment => 
          appointment.id === appointmentData.id ? appointmentData : appointment
        );
        
        setAppointments(updatedAppointments);
        showToast('Appointment updated successfully', ToastTypes.SUCCESS);
        return;
      }
      
      // Use real API
      const result = await appointmentService.updateAppointment(
        appointmentData.id,
        appointmentData
      );
      
      if (result.success) {
        const updatedAppointments = appointments.map(appointment => 
          appointment.id === appointmentData.id ? result.data : appointment
        );
        
        setAppointments(updatedAppointments);
        showToast('Appointment updated successfully', ToastTypes.SUCCESS);
      } else {
        throw new Error(result.error || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      showToast(error.message || 'Failed to update appointment', ToastTypes.ERROR);
    }
  };

  // Handle deleting an appointment
  const handleDeleteAppointment = async (appointmentId) => {
    try {
      if (ENABLE_MOCK_API) {
        // Remove from local state for demo
        setAppointments(appointments.filter(appointment => appointment.id !== appointmentId));
        showToast('Appointment deleted successfully', ToastTypes.SUCCESS);
        return;
      }
      
      // Use real API
      const result = await appointmentService.deleteAppointment(appointmentId);
      
      if (result.success) {
        setAppointments(appointments.filter(appointment => appointment.id !== appointmentId));
        showToast('Appointment deleted successfully', ToastTypes.SUCCESS);
      } else {
        throw new Error(result.error || 'Failed to delete appointment');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      showToast(error.message || 'Failed to delete appointment', ToastTypes.ERROR);
    }
  };

  return (
    <DashboardLayout title="Appointment Management">
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      ) : (
        <AppointmentCalendar
          appointments={appointments}
          onAddAppointment={handleAddAppointment}
          onUpdateAppointment={handleUpdateAppointment}
          onDeleteAppointment={handleDeleteAppointment}
        />
      )}
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default AppointmentManagement;