import React, { useState } from 'react';
import { format } from 'date-fns';

interface EventPopoverProps {
  event: {
    id: string;
    title: string;
    start: Date;
    end: Date;
    status: string;
    allDay?: boolean;
    description?: string;
    location?: string;
  };
  onClose: () => void;
  onEdit: (editedEvent: any) => void;
  onDelete: (eventId: string) => void;
}

export const EventPopover: React.FC<EventPopoverProps> = ({
  event,
  onClose,
  onEdit,
  onDelete
}) => {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || '');
  const [location, setLocation] = useState(event.location || '');
  const [status, setStatus] = useState(event.status);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onEdit({
      ...event,
      title,
      description,
      location,
      status
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Event' : 'Event Details'}
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="TENTATIVE">Tentative</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <p className="text-xl font-medium">{event.title}</p>
              <p>
                <span className="font-medium">Time:</span>{' '}
                {format(event.start, 'MMM dd, yyyy h:mm a')} - {format(event.end, 'h:mm a')}
              </p>
              {event.description && (
                <p>
                  <span className="font-medium">Description:</span> {event.description}
                </p>
              )}
              {event.location && (
                <p>
                  <span className="font-medium">Location:</span> {event.location}
                </p>
              )}
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    event.status === 'CONFIRMED'
                      ? 'bg-green-100 text-green-800'
                      : event.status === 'TENTATIVE'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {event.status}
                </span>
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          {isEditing ? (
            <>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                onClick={handleSave}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                onClick={handleDelete}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventPopover;