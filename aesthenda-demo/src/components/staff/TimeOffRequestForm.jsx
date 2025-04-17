import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { format } from 'date-fns';

// GraphQL mutation for creating a time-off request
const CREATE_TIME_OFF_REQUEST = gql`
  mutation CreateTimeOffRequest($input: TimeOffRequestInput!) {
    createTimeOffRequest(input: $input) {
      id
      startDate
      endDate
      type
      status
      reason
    }
  }
`;

// Time off request types
const requestTypes = [
  { value: 'VACATION', label: 'Vacation' },
  { value: 'SICK', label: 'Sick Leave' },
  { value: 'PERSONAL', label: 'Personal Time' },
  { value: 'OTHER', label: 'Other' }
];

const TimeOffRequestForm = ({ userId, onSuccess, onCancel }) => {
  const [isAllDay, setIsAllDay] = useState(true);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      staffId: userId,
      type: 'VACATION',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      allDay: true,
      startTime: '09:00',
      endTime: '17:00',
      reason: '',
      notes: ''
    }
  });

  const [createTimeOffRequest, { loading, error }] = useMutation(CREATE_TIME_OFF_REQUEST, {
    onCompleted: (data) => {
      reset();
      if (onSuccess) {
        onSuccess(data.createTimeOffRequest);
      }
    }
  });

  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');

  // Validate date range
  const isValidDateRange = () => {
    if (!watchStartDate || !watchEndDate) return true;
    return new Date(watchStartDate) <= new Date(watchEndDate);
  };

  const onSubmit = (data) => {
    // Format data for the mutation
    const input = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString()
    };

    createTimeOffRequest({
      variables: { input }
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-medium text-gray-800 mb-4">Request Time Off</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error.message.includes('conflicts') 
            ? 'This request conflicts with an existing approved time-off request.' 
            : error.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type of Time Off</label>
          <select
            {...register('type', { required: 'Type is required' })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          >
            {requestTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              {...register('startDate', { required: 'Start date is required' })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              {...register('endDate', { 
                required: 'End date is required',
                validate: {
                  dateRange: () => isValidDateRange() || 'End date must be on or after start date'
                }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>}
          </div>
        </div>
        
        <div className="mt-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={() => setIsAllDay(!isAllDay)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              {...register('allDay')}
            />
            <span className="ml-2 text-sm text-gray-700">All Day</span>
          </label>
        </div>
        
        {!isAllDay && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                {...register('startTime', { required: !isAllDay && 'Start time is required' })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.startTime && <p className="text-red-600 text-sm mt-1">{errors.startTime.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                {...register('endTime', { required: !isAllDay && 'End time is required' })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.endTime && <p className="text-red-600 text-sm mt-1">{errors.endTime.message}</p>}
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
          <textarea
            {...register('reason', { required: 'Reason is required' })}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder="Please provide a reason for your time off request"
          ></textarea>
          {errors.reason && <p className="text-red-600 text-sm mt-1">{errors.reason.message}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
          <textarea
            {...register('notes')}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder="Any additional information"
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimeOffRequestForm; 