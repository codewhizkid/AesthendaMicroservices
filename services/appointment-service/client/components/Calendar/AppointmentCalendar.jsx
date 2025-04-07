import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { 
  GET_APPOINTMENTS, 
  APPOINTMENT_CREATED, 
  APPOINTMENT_UPDATED, 
  APPOINTMENT_CANCELLED 
} from '../../graphql/appointments';
import LoadingSpinner from '../common/LoadingSpinner';
import AppointmentModal from './AppointmentModal';
import { useTenant } from '../../hooks/useTenant';

const localizer = momentLocalizer(moment);

const AppointmentCalendar = () => {
  const { tenantId } = useTenant();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query appointments
  const { loading, error, data, refetch } = useQuery(GET_APPOINTMENTS, {
    variables: {
      tenantId,
      filter: {
        startDate: moment(selectedDate).startOf('month').format('YYYY-MM-DD'),
        endDate: moment(selectedDate).endOf('month').format('YYYY-MM-DD')
      }
    },
    fetchPolicy: 'cache-and-network'
  });

  // Subscribe to appointment updates
  useSubscription(APPOINTMENT_CREATED, {
    variables: { tenantId },
    onData: () => refetch()
  });

  useSubscription(APPOINTMENT_UPDATED, {
    variables: { tenantId },
    onData: () => refetch()
  });

  useSubscription(APPOINTMENT_CANCELLED, {
    variables: { tenantId },
    onData: () => refetch()
  });

  // Handle date navigation
  const handleNavigate = (date) => {
    setSelectedDate(date);
  };

  // Handle appointment selection
  const handleSelectEvent = (event) => {
    setSelectedAppointment(event);
    setIsModalOpen(true);
  };

  // Handle slot selection for new appointment
  const handleSelectSlot = ({ start }) => {
    setSelectedAppointment({ startTime: start });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error loading appointments</div>;

  // Transform appointments for calendar display
  const events = data?.appointments?.edges?.map(({ node }) => ({
    id: node.id,
    title: `${node.client.firstName} ${node.client.lastName} - ${node.services.map(s => s.name).join(', ')}`,
    start: new Date(`${node.date}T${node.startTime}`),
    end: new Date(moment(`${node.date}T${node.startTime}`).add(node.duration, 'minutes').format()),
    resource: node
  })) || [];

  return (
    <div className="h-full flex flex-col">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        onNavigate={handleNavigate}
        className="flex-1 bg-white shadow-lg rounded-lg p-4"
        eventPropGetter={(event) => ({
          className: `bg-primary-500 text-white rounded px-2 py-1
            ${event.resource.status === 'CANCELLED' ? 'opacity-50' : ''}
            ${event.resource.status === 'COMPLETED' ? 'bg-green-500' : ''}
          `
        })}
      />
      
      {isModalOpen && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={handleCloseModal}
          onSuccess={() => {
            handleCloseModal();
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default AppointmentCalendar; 