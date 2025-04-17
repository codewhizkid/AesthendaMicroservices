import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { GET_AVAILABLE_SLOTS } from '../../graphql/queries';

const DateTimeSelectionStep = ({ 
  tenantId, 
  selectedServices, 
  selectedDate, 
  selectedTime, 
  onDateChange, 
  onTimeChange, 
  onNext, 
  onBack 
}) => {
  // State for calendar and time slots
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Calculate the total duration of selected services
  const totalDuration = selectedServices?.reduce((total, service) => 
    total + (parseInt(service.duration) || 0), 0) || 60; // Default to 60 minutes
  
  // Format a date to YYYY-MM-DD string
  const formatDateForApi = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Generate calendar days for the current month view
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate how many days from the previous month we need to show
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Create an array to hold all the days we'll display
    const days = [];
    
    // Add days from the previous month
    if (daysFromPrevMonth > 0) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        days.push({
          date: new Date(year, month - 1, prevMonthLastDay - i),
          isCurrentMonth: false,
          isPast: new Date(year, month - 1, prevMonthLastDay - i) < new Date(new Date().setHours(0, 0, 0, 0))
        });
      }
    }
    
    // Add days from the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isPast: date < new Date(new Date().setHours(0, 0, 0, 0)),
        isToday: date.toDateString() === new Date().toDateString()
      });
    }
    
    // Add days from the next month to complete the grid
    const daysNeeded = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= daysNeeded; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isPast: false
      });
    }
    
    setCalendarDays(days);
  }, [currentMonth]);
  
  // Function to go to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  // Function to go to next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Query for available time slots when a date is selected
  const { loading: slotsLoading, error: slotsError, data: slotsData } = useQuery(GET_AVAILABLE_SLOTS, {
    variables: {
      tenantId,
      date: selectedDate ? formatDateForApi(selectedDate) : formatDateForApi(new Date()),
      duration: totalDuration,
      serviceIds: selectedServices?.map(service => service.id) || []
    },
    skip: !selectedDate || !tenantId || selectedServices?.length === 0
  });
  
  // Update time slots when slots data changes
  useEffect(() => {
    if (slotsData?.availableTimeSlots) {
      setTimeSlots(slotsData.availableTimeSlots);
    }
    
    if (slotsError) {
      setError('Failed to load available time slots. Please try again later.');
    }
  }, [slotsData, slotsError]);
  
  // Handle date selection
  const handleDateSelect = (date) => {
    // Don't allow selecting dates in the past
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) {
      return;
    }
    
    onDateChange(date);
  };
  
  // Handle time slot selection
  const handleTimeSelect = (time) => {
    onTimeChange(time);
  };
  
  // Format time for display (e.g., "09:00" to "9:00 AM")
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${formattedHour}:${minutes} ${ampm}`;
  };
  
  // Get month name for display
  const getMonthName = (date) => {
    return date.toLocaleString('default', { month: 'long' });
  };
  
  // Validate before proceeding to next step
  const handleContinue = () => {
    if (!selectedDate) {
      setError('Please select a date.');
      return;
    }
    
    if (!selectedTime) {
      setError('Please select a time.');
      return;
    }
    
    onNext();
  };
  
  // Render the calendar days
  const renderCalendar = () => {
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return (
      <div className="mt-4">
        {/* Calendar header with month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={goToPreviousMonth}
          >
            <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-medium text-gray-900">
            {getMonthName(currentMonth)} {currentMonth.getFullYear()}
          </h3>
          <button
            type="button"
            className="p-1 rounded-full hover:bg-gray-100"
            onClick={goToNextMonth}
          >
            <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isSelected = selectedDate && 
              day.date.toDateString() === selectedDate.toDateString();
            
            return (
              <button
                key={index}
                type="button"
                disabled={day.isPast}
                className={`
                  h-10 flex items-center justify-center rounded-full
                  ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                  ${day.isPast ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
                  ${isSelected ? 'bg-blue-100 text-blue-800 font-medium' : ''}
                  ${day.isToday ? 'border border-blue-500' : ''}
                `}
                onClick={() => handleDateSelect(day.date)}
              >
                {day.date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render time slots
  const renderTimeSlots = () => {
    if (!selectedDate) {
      return (
        <div className="my-6 text-center text-gray-500">
          Please select a date to see available time slots
        </div>
      );
    }
    
    if (slotsLoading) {
      return (
        <div className="my-6 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      );
    }
    
    if (timeSlots.length === 0) {
      return (
        <div className="my-6 text-center text-gray-500">
          No available time slots for the selected date
        </div>
      );
    }
    
    return (
      <div className="my-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Available Times
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {timeSlots.map((slot, index) => (
            slot.available ? (
              <button
                key={index}
                type="button"
                className={`
                  py-2 px-3 rounded border text-sm font-medium
                  ${selectedTime === slot.time
                    ? 'bg-blue-100 border-blue-500 text-blue-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                `}
                onClick={() => handleTimeSelect(slot.time)}
              >
                {formatTime(slot.time)}
              </button>
            ) : null
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Select Date & Time</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose when you'd like to schedule your appointment
        </p>
      </div>
      
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} />
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        {/* Calendar for date selection */}
        {renderCalendar()}
        
        {/* Time slot selection */}
        {renderTimeSlots()}
        
        {/* Selected appointment summary */}
        {selectedDate && selectedTime && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-base font-medium text-gray-900 mb-2">Your Appointment</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Time:</span>
                <span className="text-sm font-medium text-gray-900">{formatTime(selectedTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Duration:</span>
                <span className="text-sm font-medium text-gray-900">{totalDuration} min</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="button"
          className={`
            py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${selectedDate && selectedTime
              ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'bg-gray-300 cursor-not-allowed'
            }
          `}
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default DateTimeSelectionStep; 