import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_TENANT } from '../../graphql/queries';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import appointmentService from '../../api/appointmentService';
import Toast, { ToastTypes } from '../../components/common/Toast';
import { format, isPast, addHours, parseISO } from 'date-fns';

const ManageAppointments = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [toast, setToast] = useState(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);

  // Query to get tenant information for branding
  const { data: tenantData, loading: tenantLoading, error: tenantError } = useQuery(GET_TENANT, {
    variables: { id: tenantId },
    skip: !tenantId
  });

  // Set up tenant loading state
  useEffect(() => {
    if (!tenantLoading && tenantData) {
      setLoading(false);
    }
    
    if (tenantError) {
      setError('Unable to load salon information. Please try again later.');
      setLoading(false);
    }
  }, [tenantLoading, tenantData, tenantError]);

  // Handle appointment verification
  const handleVerifyIdentity = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // In a real app, this would call an API endpoint
      // For now, we'll simulate with a timeout and mock data
      setTimeout(() => {
        const mockAppointments = [
          {
            id: 'appt-001',
            date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            startTime: '10:00',
            endTime: '11:00',
            status: 'confirmed',
            services: [{ name: 'Haircut', price: 45 }, { name: 'Style', price: 35 }],
            totalPrice: 80,
            stylist: { firstName: 'Sarah', lastName: 'Johnson' },
            client: { firstName: 'John', lastName: 'Doe', email, phone }
          },
          {
            id: 'appt-002',
            date: new Date(Date.now() + 7 * 86400000).toISOString(), // Next week
            startTime: '14:00',
            endTime: '15:30',
            status: 'confirmed',
            services: [{ name: 'Color', price: 120 }],
            totalPrice: 120,
            stylist: { firstName: 'Michael', lastName: 'Wilson' },
            client: { firstName: 'John', lastName: 'Doe', email, phone }
          }
        ];
        
        setAppointments(mockAppointments);
        setIsVerifying(false);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      setError('Failed to verify your appointments. Please try again.');
      setLoading(false);
    }
  };

  // Format date
  const formatAppointmentDate = (dateStr) => {
    const date = new Date(dateStr);
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Check if rescheduling is allowed based on appointment date
  const canReschedule = (appointment) => {
    // If within 24 hours of appointment, don't allow rescheduling
    const appointmentDate = parseISO(appointment.date);
    return !isPast(addHours(appointmentDate, -24));
  };

  // Check if cancellation is allowed based on appointment date
  const canCancel = (appointment) => {
    // If within 24 hours of appointment, don't allow cancellation
    const appointmentDate = parseISO(appointment.date);
    return !isPast(addHours(appointmentDate, -24));
  };

  // Handle reschedule click
  const handleRescheduleClick = (appointment) => {
    setSelectedAppointment(appointment);
    setIsRescheduling(true);
    setIsCancelling(false);
    
    // Load available slots
    setIsLoadingSlots(true);
    
    // Default date for rescheduling is tomorrow
    const tomorrow = format(addHours(new Date(), 24), 'yyyy-MM-dd');
    setRescheduleDate(tomorrow);
    
    // Simulate fetching available slots
    setTimeout(() => {
      const mockSlots = [
        { time: '09:00', available: true },
        { time: '10:00', available: true },
        { time: '11:00', available: true },
        { time: '13:00', available: true },
        { time: '14:00', available: true },
        { time: '15:00', available: true },
        { time: '16:00', available: true }
      ];
      setAvailableSlots(mockSlots);
      setIsLoadingSlots(false);
    }, 800);
  };

  // Handle cancel click
  const handleCancelClick = (appointment) => {
    setSelectedAppointment(appointment);
    setIsCancelling(true);
    setIsRescheduling(false);
    setCancellationReason('');
  };

  // Handle reschedule submit
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleTime) {
      setToast({
        message: 'Please select both a date and time.',
        type: ToastTypes.ERROR
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would call the rescheduleAppointment API
      // For now, we'll simulate success
      setTimeout(() => {
        // Update appointment in state
        const updatedAppointments = appointments.map(appt => {
          if (appt.id === selectedAppointment.id) {
            return {
              ...appt,
              date: rescheduleDate,
              startTime: rescheduleTime,
              endTime: format(addHours(parseISO(`${rescheduleDate}T${rescheduleTime}`), 1), 'HH:mm')
            };
          }
          return appt;
        });
        
        setAppointments(updatedAppointments);
        setIsRescheduling(false);
        setSelectedAppointment(null);
        setToast({
          message: 'Your appointment has been rescheduled.',
          type: ToastTypes.SUCCESS
        });
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      setToast({
        message: 'Failed to reschedule your appointment. Please try again.',
        type: ToastTypes.ERROR
      });
      setLoading(false);
    }
  };

  // Handle cancel submit
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellationReason) {
      setToast({
        message: 'Please provide a reason for cancellation.',
        type: ToastTypes.ERROR
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would call the cancelAppointment API
      // For now, we'll simulate success
      setTimeout(() => {
        // Update appointment in state
        const updatedAppointments = appointments.map(appt => {
          if (appt.id === selectedAppointment.id) {
            return {
              ...appt,
              status: 'cancelled',
              cancellationReason
            };
          }
          return appt;
        });
        
        setAppointments(updatedAppointments);
        setIsCancelling(false);
        setSelectedAppointment(null);
        setToast({
          message: 'Your appointment has been cancelled.',
          type: ToastTypes.INFO
        });
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      setToast({
        message: 'Failed to cancel your appointment. Please try again.',
        type: ToastTypes.ERROR
      });
      setLoading(false);
    }
  };

  // If no tenant ID is provided, show error
  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <ErrorMessage message="No salon identifier provided. Please check your link and try again." />
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show error if tenant not found
  if (error || !tenantData?.tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full">
          <ErrorMessage message={error || 'Salon not found. Please check your link and try again.'} />
        </div>
      </div>
    );
  }

  // Get tenant information
  const tenant = tenantData.tenant;
  const primaryColor = tenant.settings?.branding?.primaryColor || '#0ea5e9';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Tenant header with branding */}
      <header className="py-6 px-4 sm:px-6 bg-white shadow-sm" style={{ backgroundColor: `${primaryColor}10` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {tenant.settings?.branding?.logoUrl ? (
              <img 
                src={tenant.settings.branding.logoUrl} 
                alt={tenant.businessName} 
                className="h-10 w-auto cursor-pointer"
                onClick={() => navigate(`/${tenantId}`)}
              />
            ) : (
              <h1 
                className="text-xl font-bold cursor-pointer" 
                style={{ color: primaryColor }}
                onClick={() => navigate(`/${tenantId}`)}
              >
                {tenant.businessName}
              </h1>
            )}
          </div>
          <button
            onClick={() => navigate(`/${tenantId}`)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Booking
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Manage Your Appointments
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            View, reschedule, or cancel your appointments with {tenant.businessName}.
          </p>
        </div>

        {/* Identity Verification */}
        {isVerifying ? (
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Find Your Appointments
              </h2>
              <p className="text-gray-600 mb-6">
                Please enter the email and phone number you used to book your appointment.
              </p>
              
              <form onSubmit={handleVerifyIdentity}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                      style={{ borderColor: email ? primaryColor : undefined }}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-primary-500 focus:border-primary-500"
                      style={{ borderColor: phone ? primaryColor : undefined }}
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                  >
                    Find My Appointments
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Appointment List */}
            {appointments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Appointments Found</h2>
                <p className="text-gray-600 mb-6">
                  We couldn't find any appointments associated with the provided email and phone number.
                </p>
                <button
                  onClick={() => navigate(`/${tenantId}/booking/services`)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                >
                  Book a New Appointment
                </button>
              </div>
            ) : (
              <>
                {/* Appointments List */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className={`p-6 ${appointment.status === 'cancelled' ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div className="mb-4 md:mb-0">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-medium text-gray-900 mr-3">
                              Appointment with {appointment.stylist.firstName}
                            </h3>
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'confirmed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : appointment.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatAppointmentDate(appointment.date)} • {appointment.startTime} - {appointment.endTime}
                          </p>
                          <div className="mt-2 text-sm">
                            <p className="font-medium text-gray-700">Services:</p>
                            <ul className="mt-1">
                              {appointment.services.map((service, index) => (
                                <li key={index} className="flex justify-between">
                                  <span>{service.name}</span>
                                  <span className="text-gray-600">${service.price}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between font-medium">
                              <span>Total:</span>
                              <span>${appointment.totalPrice}</span>
                            </div>
                          </div>
                        </div>
                        
                        {appointment.status !== 'cancelled' && (
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleRescheduleClick(appointment)}
                              disabled={!canReschedule(appointment)}
                              className={`inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${!canReschedule(appointment) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleCancelClick(appointment)}
                              disabled={!canCancel(appointment)}
                              className={`inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${!canCancel(appointment) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        
                        {appointment.status === 'cancelled' && appointment.cancellationReason && (
                          <div className="mt-3 bg-red-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-red-800">Cancellation Reason:</p>
                            <p className="mt-1 text-sm text-red-700">{appointment.cancellationReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* New Booking Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate(`/${tenantId}/booking/services`)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                  >
                    Book a New Appointment
                  </button>
                </div>
              </>
            )}
            
            {/* Reschedule Modal */}
            {isRescheduling && selectedAppointment && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Reschedule Appointment</h3>
                  </div>
                  <form onSubmit={handleRescheduleSubmit}>
                    <div className="px-6 py-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Current appointment: {formatAppointmentDate(selectedAppointment.date)} at {selectedAppointment.startTime}
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="reschedule-date" className="block text-sm font-medium text-gray-700">
                            New Date
                          </label>
                          <input
                            type="date"
                            id="reschedule-date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            min={format(addHours(new Date(), 24), 'yyyy-MM-dd')}
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="reschedule-time" className="block text-sm font-medium text-gray-700">
                            New Time
                          </label>
                          {isLoadingSlots ? (
                            <div className="mt-2 flex justify-center">
                              <LoadingSpinner size="sm" />
                            </div>
                          ) : (
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              {availableSlots.map((slot) => (
                                <button
                                  key={slot.time}
                                  type="button"
                                  onClick={() => setRescheduleTime(slot.time)}
                                  disabled={!slot.available}
                                  className={`py-2 px-3 text-sm font-medium rounded-md ${
                                    rescheduleTime === slot.time
                                      ? 'bg-primary-100 text-primary-800 border-primary-500 border'
                                      : slot.available
                                      ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                  style={rescheduleTime === slot.time ? { borderColor: primaryColor, color: primaryColor, backgroundColor: `${primaryColor}15` } : {}}
                                >
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsRescheduling(false)}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                      >
                        Confirm Reschedule
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* Cancel Modal */}
            {isCancelling && selectedAppointment && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Cancel Appointment</h3>
                  </div>
                  <form onSubmit={handleCancelSubmit}>
                    <div className="px-6 py-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Are you sure you want to cancel your appointment on {formatAppointmentDate(selectedAppointment.date)} at {selectedAppointment.startTime}?
                      </p>
                      
                      <div>
                        <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700">
                          Reason for Cancellation
                        </label>
                        <textarea
                          id="cancellation-reason"
                          value={cancellationReason}
                          onChange={(e) => setCancellationReason(e.target.value)}
                          required
                          rows={3}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                          placeholder="Please let us know why you're cancelling..."
                        />
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsCancelling(false)}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Keep Appointment
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Confirm Cancellation
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {tenant.businessName}. All rights reserved.</p>
          <p className="mt-2">Powered by Aesthenda</p>
        </div>
      </footer>
      
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div 
            className={`px-4 py-3 rounded-lg shadow-lg text-white ${
              toast.type === ToastTypes.SUCCESS 
                ? 'bg-green-600' 
                : toast.type === ToastTypes.ERROR
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
          >
            <div className="flex items-center">
              {toast.type === ToastTypes.SUCCESS && (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === ToastTypes.ERROR && (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toast.type === ToastTypes.INFO && (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAppointments; 