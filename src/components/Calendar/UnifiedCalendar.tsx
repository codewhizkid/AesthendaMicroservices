import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Views, NavigateAction } from 'react-big-calendar';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { format, parseISO } from 'date-fns';
import { GET_EVENTS, CREATE_EVENT, UPDATE_EVENT, DELETE_EVENT, EVENT_UPDATED } from '../../graphql/calendar';
import { CalendarToolbar } from './CalendarToolbar';
import { EventPopover } from './EventPopover';
import useAuth from '../../hooks/useAuth';

interface UnifiedCalendarProps {
  localizer: any;
  defaultView?: string;
  defaultDate?: Date;
  tenantId: string;
}

export const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({
  localizer,
  defaultView = 'week',
  defaultDate = new Date(),
  tenantId
}) => {
  const { user } = useAuth();
  const [view, setView] = useState(defaultView);
  const [date, setDate] = useState(defaultDate);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Calculate the visible range based on current view and date
  const visibleRange = useMemo(() => {
    const start = new Date(date);
    const end = new Date(date);

    switch (view) {
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - start.getDay());
        end.setDate(end.getDate() + (6 - end.getDay()));
        break;
      case 'day':
        end.setDate(end.getDate() + 1);
        break;
      default:
        break;
    }

    return { start, end };
  }, [view, date]);

  // Fetch calendar data
  const { loading, error, data, refetch } = useQuery(GET_EVENTS, {
    variables: {
      filter: {
        startDate: visibleRange.start,
        endDate: visibleRange.end
      },
      pagination: {
        page: 1,
        limit: 100
      }
    }
  });

  // Subscribe to event updates
  useSubscription(EVENT_UPDATED, {
    variables: {
      tenantId
    },
    onData: () => {
      refetch();
    }
  });

  // Mutations
  const [createEvent] = useMutation(CREATE_EVENT, {
    onCompleted: () => refetch()
  });
  
  const [updateEvent] = useMutation(UPDATE_EVENT, {
    onCompleted: () => refetch()
  });
  
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    onCompleted: () => refetch()
  });

  // Transform events for the calendar
  const events = useMemo(() => {
    if (!data?.events?.edges) return [];

    return data.events.edges.map((event: any) => ({
      id: event.id,
      title: event.title,
      start: parseISO(event.startTime),
      end: parseISO(event.endTime),
      status: event.status,
      allDay: event.allDay,
      description: event.description,
      location: event.location,
      metadata: event.metadata
    }));
  }, [data]);

  // Handle calendar navigation
  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  // Handle view change
  const handleViewChange = (newView: string) => {
    setView(newView);
  };

  // Handle event selection
  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
  };

  // Handle event creation
  const handleSelectSlot = (slotInfo: any) => {
    const newEvent = {
      title: "New Event",
      startTime: slotInfo.start.toISOString(),
      endTime: slotInfo.end.toISOString(),
      allDay: slotInfo.slots.length > 1,
      status: "TENTATIVE"
    };
    
    createEvent({
      variables: {
        input: newEvent
      }
    });
  };

  // Custom event component
  const EventComponent = ({ event }: any) => (
    <div
      className="rbc-event"
      style={{
        backgroundColor: event.status === "CONFIRMED" ? "#4CAF50" :
                         event.status === "TENTATIVE" ? "#FFC107" : 
                         "#F44336",
        borderRadius: '4px',
        padding: '2px 4px'
      }}
    >
      <div className="rbc-event-content" title={event.title}>
        {format(event.start, 'HH:mm')} - {event.title}
      </div>
    </div>
  );

  // Custom toolbar component
  const CustomToolbar = (props: any) => (
    <CalendarToolbar
      {...props}
      onViewChange={handleViewChange}
    />
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="h-full flex flex-col">
      <Calendar
        localizer={localizer}
        events={events}
        defaultView={defaultView}
        view={view}
        onView={handleViewChange}
        date={date}
        onNavigate={handleNavigate}
        selectable={true}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        components={{
          event: EventComponent,
          toolbar: CustomToolbar
        }}
        className="flex-1"
        style={{ minHeight: '600px' }}
      />

      {selectedEvent && (
        <EventPopover
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(editedEvent) => {
            updateEvent({
              variables: {
                id: editedEvent.id,
                input: {
                  title: editedEvent.title,
                  startTime: editedEvent.start.toISOString(),
                  endTime: editedEvent.end.toISOString(),
                  status: editedEvent.status,
                  allDay: editedEvent.allDay,
                  description: editedEvent.description,
                  location: editedEvent.location,
                }
              }
            });
            setSelectedEvent(null);
          }}
          onDelete={(eventId) => {
            deleteEvent({
              variables: {
                id: eventId
              }
            });
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}; 