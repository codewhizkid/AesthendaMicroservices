import React, { useState } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  endOfWeek,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { componentClasses } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import AppointmentModal from './AppointmentModal';
import AppointmentDetails from './AppointmentDetails';
import ErrorBoundary from '../../components/ErrorBoundary';

const AppointmentCalendar = ({ appointments, onAddAppointment, onUpdateAppointment, onDeleteAppointment }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [calendarView, setCalendarView] = useState('month');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const { user } = useAuth();
  const { tenantData } = useTenant();
  
  // Calculate appointments for the selected date
  const dayAppointments = appointments.filter(appointment => 
    isSameDay(new Date(appointment.date), selectedDate)
  );
  
  // Navigation functions
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
  // Modal functions
  const openAddModal = (date) => {
    setSelectedDate(date);
    setIsAddModalOpen(true);
  };
  
  const viewAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsOpen(true);
  };
  
  // Handle appointment actions
  const handleAddAppointment = (appointmentData) => {
    onAddAppointment({
      ...appointmentData,
      date: selectedDate
    });
    setIsAddModalOpen(false);
  };
  
  const handleUpdateAppointment = (appointmentData) => {
    onUpdateAppointment(appointmentData);
    setIsDetailsOpen(false);
  };
  
  const handleDeleteAppointment = (appointmentId) => {
    onDeleteAppointment(appointmentId);
    setIsDetailsOpen(false);
  };
  
  // Render the header with month and navigation
  const renderHeader = () => {
    const { header } = componentClasses.calendar;
    return (
      <div className={header}>
        <button 
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button 
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  };
  
  // Render the days of the week
  const renderDays = () => {
    const days = [];
    const dateFormat = 'EEEE';
    const startDay = startOfWeek(currentMonth);
    
    for (let i = 0; i < 7; i++) {
      days.push(
        <div 
          key={i} 
          className="font-semibold text-center py-2 text-sm text-gray-600"
        >
          {format(addDays(startDay, i), dateFormat)}
        </div>
      );
    }
    
    return <div className={componentClasses.calendar.grid}>{days}</div>;
  };
  
  // Render the calendar cells
  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const rows = [];
    let days = [];
    let day = startDate;
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const formattedDate = format(day, 'd');
        const isToday = isSameDay(day, new Date());
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        
        const dayAppts = appointments.filter(appt => 
          isSameDay(new Date(appt.date), cloneDay)
        );
        
        const cellClasses = [
          componentClasses.calendar.cell.base,
          isToday ? componentClasses.calendar.cell.today : '',
          isSelected ? componentClasses.calendar.cell.selected : '',
          !isCurrentMonth ? componentClasses.calendar.cell.disabled : '',
        ].filter(Boolean).join(' ');
        
        days.push(
          <div
            key={day}
            className={cellClasses}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <div className="flex justify-between items-center mb-1">
              <span className={`text-sm ${isToday ? 'font-bold' : ''}`}>
                {formattedDate}
              </span>
              {isCurrentMonth && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openAddModal(cloneDay);
                  }}
                  className="w-5 h-5 flex items-center justify-center hover:bg-primary-100 rounded-full"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
            
            {dayAppts.slice(0, 3).map((appointment, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  viewAppointmentDetails(appointment);
                }}
                className="p-1 text-xs font-medium rounded-sm mb-1 bg-primary-100 hover:bg-primary-200 cursor-pointer"
              >
                {appointment.startTime} - {appointment.client?.firstName}
              </div>
            ))}
            
            {dayAppts.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{dayAppts.length - 3} more
              </div>
            )}
          </div>
        );
        
        day = addDays(day, 1);
      }
      
      rows.push(
        <div key={day} className={componentClasses.calendar.grid}>
          {days}
        </div>
      );
      days = [];
    }
    
    return <div>{rows}</div>;
  };
  
  return (
    <ErrorBoundary fallbackMessage="Custom error message">
      <div className={componentClasses.calendar.container}>
        {renderHeader()}
        {renderDays()}
        {renderCells()}
        
        {isAddModalOpen && (
          <AppointmentModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddAppointment}
            initialDate={selectedDate}
          />
        )}
        
        {isDetailsOpen && selectedAppointment && (
          <AppointmentDetails
            isOpen={isDetailsOpen}
            onClose={() => setIsDetailsOpen(false)}
            appointment={selectedAppointment}
            onUpdate={handleUpdateAppointment}
            onDelete={handleDeleteAppointment}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AppointmentCalendar; 