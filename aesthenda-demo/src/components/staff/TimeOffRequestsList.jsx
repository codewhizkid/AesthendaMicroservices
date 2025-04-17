import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { format } from 'date-fns';
import TimeOffRequestForm from './TimeOffRequestForm';

// GraphQL queries and mutations
const GET_TIME_OFF_REQUESTS = gql`
  query GetTimeOffRequests($filter: TimeOffRequestFilterInput, $pagination: PaginationInput) {
    timeOffRequests(filter: $filter, pagination: $pagination, sortBy: "startDate", sortOrder: "DESC") {
      edges {
        id
        startDate
        endDate
        allDay
        startTime
        endTime
        type
        status
        reason
        notes
        requestedAt
        reviewedAt
        reviewNotes
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const CANCEL_TIME_OFF_REQUEST = gql`
  mutation CancelTimeOffRequest($id: ID!) {
    cancelTimeOffRequest(id: $id) {
      id
      status
    }
  }
`;

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'DENIED':
        return 'bg-red-100 text-red-700';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

// Type badge component
const TypeBadge = ({ type }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'VACATION':
        return 'bg-blue-100 text-blue-800';
      case 'SICK':
        return 'bg-purple-100 text-purple-800';
      case 'PERSONAL':
        return 'bg-indigo-100 text-indigo-800';
      case 'OTHER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getLabel = () => {
    switch (type) {
      case 'VACATION':
        return 'Vacation';
      case 'SICK':
        return 'Sick Leave';
      case 'PERSONAL':
        return 'Personal';
      case 'OTHER':
        return 'Other';
      default:
        return type;
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeStyles()}`}>
      {getLabel()}
    </span>
  );
};

const TimeOffRequestsList = ({ userId, isAdmin = false }) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Apply filters based on role
  const filter = isAdmin ? {} : { staffId: userId };
  
  // Query time-off requests
  const { loading, error, data, refetch } = useQuery(GET_TIME_OFF_REQUESTS, {
    variables: {
      filter,
      pagination: {
        page: currentPage,
        limit: pageSize
      }
    },
    fetchPolicy: 'network-only'
  });
  
  // Mutation for canceling requests
  const [cancelTimeOffRequest] = useMutation(CANCEL_TIME_OFF_REQUEST, {
    onCompleted: () => {
      refetch();
    }
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  // Format date range for display
  const formatDateRange = (startDate, endDate, allDay, startTime, endTime) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      // Same day
      if (allDay) {
        return `${formatDate(start)} (All day)`;
      } else {
        return `${formatDate(start)} ${startTime} - ${endTime}`;
      }
    } else {
      // Date range
      if (allDay) {
        return `${formatDate(start)} - ${formatDate(end)} (All day)`;
      } else {
        return `${formatDate(start)} ${startTime} - ${formatDate(end)} ${endTime}`;
      }
    }
  };
  
  // Handle request cancellation
  const handleCancelRequest = (id) => {
    if (window.confirm('Are you sure you want to cancel this time-off request?')) {
      cancelTimeOffRequest({
        variables: { id }
      });
    }
  };
  
  // Handle form submission success
  const handleRequestSuccess = () => {
    setShowRequestForm(false);
    refetch();
  };
  
  // Check if request can be cancelled
  const canCancel = (request) => {
    return request.status === 'PENDING' || request.status === 'APPROVED';
  };
  
  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-800">Time Off Requests</h2>
        
        <button
          onClick={() => setShowRequestForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Request Time Off
        </button>
      </div>
      
      {/* Request form */}
      {showRequestForm && (
        <TimeOffRequestForm
          userId={userId}
          onSuccess={handleRequestSuccess}
          onCancel={() => setShowRequestForm(false)}
        />
      )}
      
      {/* Request details */}
      {selectedRequest && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Request Details</h3>
            <button
              onClick={() => setSelectedRequest(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <p><TypeBadge type={selectedRequest.type} /></p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p><StatusBadge status={selectedRequest.status} /></p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date(s)</p>
              <p className="text-gray-900">
                {formatDateRange(
                  selectedRequest.startDate,
                  selectedRequest.endDate,
                  selectedRequest.allDay,
                  selectedRequest.startTime,
                  selectedRequest.endTime
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Requested On</p>
              <p className="text-gray-900">{formatDate(selectedRequest.requestedAt)}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500">Reason</p>
            <p className="text-gray-900">{selectedRequest.reason}</p>
          </div>
          
          {selectedRequest.notes && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Additional Notes</p>
              <p className="text-gray-900">{selectedRequest.notes}</p>
            </div>
          )}
          
          {selectedRequest.reviewedAt && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Reviewed On</p>
              <p className="text-gray-900">{formatDate(selectedRequest.reviewedAt)}</p>
            </div>
          )}
          
          {selectedRequest.reviewNotes && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-500">Review Notes</p>
              <p className="text-gray-900">{selectedRequest.reviewNotes}</p>
            </div>
          )}
          
          {canCancel(selectedRequest) && (
            <div className="flex justify-end mt-4">
              <button
                onClick={() => handleCancelRequest(selectedRequest.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel Request
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Requests list */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-500">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            <p>Error loading requests: {error.message}</p>
          </div>
        ) : data.timeOffRequests.edges.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No time-off requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date(s)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.timeOffRequests.edges.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <TypeBadge type={request.type} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDateRange(
                        request.startDate,
                        request.endDate,
                        request.allDay,
                        request.startTime,
                        request.endTime
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(request.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        View
                      </button>
                      {canCancel(request) && (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {data && data.timeOffRequests.totalCount > pageSize && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!data.timeOffRequests.pageInfo.hasPreviousPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="text-sm text-gray-700">
                Page {currentPage}
              </div>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!data.timeOffRequests.pageInfo.hasNextPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeOffRequestsList; 