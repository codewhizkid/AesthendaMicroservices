import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { startOfDay, endOfDay, addMonths, subMonths } from 'date-fns';
import {
  GET_CALENDAR_VIEW,
  UPDATE_EVENT_STATUS,
  DELETE_EVENT,
  CREATE_EVENT,
  UPDATE_EVENT,
  CREATE_BLOCKOUT,
  UPDATE_BUSINESS_HOURS,
  CALENDAR_UPDATED,
  BUSINESS_HOURS_UPDATED,
  BLOCKOUT_UPDATED
} from '../graphql/calendar';
import {
  CalendarView,
  CalendarViewFilter,
  EventStatus,
  CreateEventInput,
  UpdateEventInput,
  CreateBlockoutInput,
  UpdateBusinessHoursInput
} from '../types/calendar';

interface UseCalendarOptions {
  defaultView?: string;
  defaultDate?: Date;
}

export const useCalendar = (options: UseCalendarOptions = {}) => {
  const {
    defaultView = 'week',
    defaultDate = new Date()
  } = options;

  const [view, setView] = useState(defaultView);
  const [date, setDate] = useState(defaultDate);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Calculate visible range based on current view and date
  const getVisibleRange = useCallback(() => {
    const start = startOfDay(date);
    const end = endOfDay(date);

    switch (view) {
      case 'month':
        return {
          start: startOfDay(subMonths(start, 1)),
          end: endOfDay(addMonths(end, 1))
        };
      case 'week':
        return {
          start: startOfDay(new Date(date.setDate(date.getDate() - date.getDay()))),
          end: endOfDay(new Date(date.setDate(date.getDate() + 6)))
        };
      case 'day':
      default:
        return { start, end };
    }
  }, [view, date]);

  // Fetch calendar data
  const { loading, error, data, refetch } = useQuery<{ getCalendarView: CalendarView }>(
    GET_CALENDAR_VIEW,
    {
      variables: {
        filter: {
          startDate: getVisibleRange().start,
          endDate: getVisibleRange().end
        }
      }
    }
  );

  // Mutations
  const [updateEventStatus] = useMutation(UPDATE_EVENT_STATUS);
  const [deleteEvent] = useMutation(DELETE_EVENT);
  const [createEvent] = useMutation(CREATE_EVENT);
  const [updateEvent] = useMutation(UPDATE_EVENT);
  const [createBlockout] = useMutation(CREATE_BLOCKOUT);
  const [updateBusinessHours] = useMutation(UPDATE_BUSINESS_HOURS);

  // Subscribe to updates
  useSubscription(CALENDAR_UPDATED, {
    onData: ({ data }) => {
      if (data) {
        refetch();
      }
    }
  });

  useSubscription(BUSINESS_HOURS_UPDATED, {
    onData: ({ data }) => {
      if (data) {
        refetch();
      }
    }
  });

  useSubscription(BLOCKOUT_UPDATED, {
    onData: ({ data }) => {
      if (data) {
        refetch();
      }
    }
  });

  // Calendar operations
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: string) => {
    setView(newView);
  }, []);

  const handleSelectEvent = useCallback((event: any) => {
    setSelectedEvent(event);
  }, []);

  const handleEventStatusChange = useCallback(async (eventId: string, status: EventStatus) => {
    try {
      await updateEventStatus({
        variables: {
          eventId,
          status
        }
      });
    } catch (error) {
      console.error('Failed to update event status:', error);
      throw error;
    }
  }, [updateEventStatus]);

  const handleCreateEvent = useCallback(async (input: CreateEventInput) => {
    try {
      const result = await createEvent({
        variables: {
          input
        }
      });
      return result.data.createEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }, [createEvent]);

  const handleUpdateEvent = useCallback(async (eventId: string, input: UpdateEventInput) => {
    try {
      const result = await updateEvent({
        variables: {
          eventId,
          input
        }
      });
      return result.data.updateEvent;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  }, [updateEvent]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEvent({
        variables: {
          eventId
        }
      });
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  }, [deleteEvent]);

  const handleCreateBlockout = useCallback(async (input: CreateBlockoutInput) => {
    try {
      const result = await createBlockout({
        variables: {
          input
        }
      });
      return result.data.createBlockout;
    } catch (error) {
      console.error('Failed to create blockout:', error);
      throw error;
    }
  }, [createBlockout]);

  const handleUpdateBusinessHours = useCallback(async (input: UpdateBusinessHoursInput) => {
    try {
      const result = await updateBusinessHours({
        variables: {
          input
        }
      });
      return result.data.updateBusinessHours;
    } catch (error) {
      console.error('Failed to update business hours:', error);
      throw error;
    }
  }, [updateBusinessHours]);

  return {
    loading,
    error,
    view,
    date,
    selectedEvent,
    events: data?.getCalendarView?.events || [],
    resources: data?.getCalendarView?.resources || [],
    blockouts: data?.getCalendarView?.blockouts || [],
    businessHours: data?.getCalendarView?.businessHours || [],
    onNavigate: handleNavigate,
    onViewChange: handleViewChange,
    onSelectEvent: handleSelectEvent,
    onEventStatusChange: handleEventStatusChange,
    onCreateEvent: handleCreateEvent,
    onUpdateEvent: handleUpdateEvent,
    onDeleteEvent: handleDeleteEvent,
    onCreateBlockout: handleCreateBlockout,
    onUpdateBusinessHours: handleUpdateBusinessHours,
    refetch
  };
};

export default useCalendar; 