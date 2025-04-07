import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import api from '../api';
import { ENABLE_MOCK_API } from '../config';

// Appointment card component
const AppointmentCard = ({ appointment }) => {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Load service details
  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (!appointment.serviceId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        if (ENABLE_MOCK_API) {
          // Use mock data
          const serviceDetails = api.mock.getServiceById(appointment.serviceId);
          setService(serviceDetails);
        } else {
          // Use real API
          const result = await api.tenant.getServiceById(appointment.serviceId);
          if (result.success) {
            setService(result.data);
          }
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServiceDetails();
  }, [appointment.serviceId]);
  
  // Format time function
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date
  const formatDate = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{appointment.clientName}</h3>
          <p className="text-sm text-gray-500">{appointment.clientPhone}</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {appointment.status}
        </span>
      </div>
      
      <div className="mt-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span className="text-sm text-gray-700">
          {formatDate(appointment.startTime)} • {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
        </span>
      </div>
      
      <div className="mt-2">
        {loading ? (
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
        ) : service ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">{service.name}</p>
              <p className="text-sm text-gray-500">${service.price} • {service.duration} min</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Service information unavailable</p>
        )}
      </div>
      
      {appointment.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 italic">
            <span className="font-medium">Notes:</span> {appointment.notes}
          </p>
        </div>
      )}
    </div>
  );
};

// Main Dashboard
const Dashboard = () => {
  const { currentUser } = useAuth();
  const { tenantData, getStylistAppointments } = useTenant();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Get appointments based on role
    setLoading(true);
    
    let appointmentsToShow = [];
    
    if (currentUser.role === 'stylist') {
      // Stylist only sees their appointments
      appointmentsToShow = getStylistAppointments();
    } else {
      // Admin sees all salon appointments
      appointmentsToShow = tenantData?.appointments || [];
    }
    
    // Sort by date/time
    appointmentsToShow.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    setAppointments(appointmentsToShow);
    setLoading(false);
  }, [currentUser, tenantData, getStylistAppointments]);
  
  return (
    <DashboardLayout title="Appointments">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Today's Schedule</h2>
        <p className="text-sm text-gray-600">
          {currentUser.role === 'stylist' 
            ? 'Your appointments for today' 
            : 'All salon appointments'
          }
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : appointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map(appointment => (
            <AppointmentCard 
              key={appointment.id} 
              appointment={appointment} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No appointments</h3>
          <p className="mt-1 text-sm text-gray-500">You have no upcoming appointments scheduled.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;