import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { format } from 'date-fns';

// GraphQL queries and mutations
const GET_PENDING_TIME_OFF_REQUESTS = gql`
  query GetPendingTimeOffRequests($pagination: PaginationInput) {
    pendingTimeOffRequests(pagination: $pagination) {
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
        staff {
          id
          firstName
          lastName
          profile {
            title
            avatar
          }
        }
      }
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const APPROVE_TIME_OFF_REQUEST = gql`
  mutation ApproveTimeOffRequest($id: ID!, $reviewNotes: String) {
    approveTimeOffRequest(id: $id, reviewNotes: $reviewNotes) {
      id
      status
      reviewedAt
      reviewNotes
    }
  }
`;

const DENY_TIME_OFF_REQUEST = gql`
  mutation DenyTimeOffRequest($id: ID!, $reviewNotes: String) {
    denyTimeOffRequest(id: $id, reviewNotes: $reviewNotes) {
      id
      status
      reviewedAt
      reviewNotes
    }
  }
`;

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

const TimeOffApprovalList = () => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Query pending time-off requests
  const { loading, error, data, refetch } = useQuery(GET_PENDING_TIME_OFF_REQUESTS, {
    variables: {
      pagination: {
        page: currentPage,
        limit: pageSize
      }
    },
    fetchPolicy: 'network-only'
  });
  
  // Mutations for approving and denying requests
  const [approveTimeOffRequest, { loading: approveLoading }] = useMutation(APPROVE_TIME_OFF_REQUEST, {
    onCompleted: () => {
      refetch();
      setSelectedRequest(null);
      setReviewNotes('');
    }
  });
  
  const [denyTimeOffRequest, { loading: denyLoading }] = useMutation(DENY_TIME_OFF_REQUEST, {
    onCompleted: () => {
      refetch();
      setSelectedRequest(null);
      setReviewNotes('');
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
  
  // Handle request approval
  const handleApprove = () => {
    if (!selectedRequest) return;
    
    approveTimeOffRequest({
      variables: {
        id: selectedRequest.id,
        reviewNotes: reviewNotes.trim() || undefined
      }
    });
  };
  
  // Handle request denial
  const handleDeny = () => {
    if (!selectedRequest) return;
    
    denyTimeOffRequest({
      variables: {
        id: selectedRequest.id,
        reviewNotes: reviewNotes.trim() || undefined
      }
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-gray-800">Pending Time Off Requests</h2>
        <button 
          onClick={() => refetch()}
          className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 flex items-center"
        >
          <svg className="h-4 w-4 mr-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Refresh
        </button>
      </div>
      
      {/* Request review panel */}
      {selectedRequest && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-800">Review Request</h3>
              <TypeBadge type={selectedRequest.type} />
            </div>
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
          
          <div className="mt-4 flex items-center space-x-3">
            {selectedRequest.staff?.profile?.avatar ? (
              <img
                src={selectedRequest.staff.profile.avatar}
                alt={`${selectedRequest.staff.firstName} ${selectedRequest.staff.lastName}`}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">
                  {selectedRequest.staff?.firstName?.charAt(0) || ''}
                  {selectedRequest.staff?.lastName?.charAt(0) || ''}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">
                {selectedRequest.staff?.firstName} {selectedRequest.staff?.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {selectedRequest.staff?.profile?.title || 'Staff Member'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Dates</p>
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
          
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500">Reason</p>
            <p className="text-gray-900">{selectedRequest.reason}</p>
          </div>
          
          {selectedRequest.notes && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Additional Notes</p>
              <p className="text-gray-900">{selectedRequest.notes}</p>
            </div>
          )}
          
          <div className="mt-6">
            <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700">
              Review Notes (Optional)
            </label>
            <textarea
              id="reviewNotes"
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Add any notes about this request (will be visible to the staff member)"
            ></textarea>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleDeny}
              disabled={denyLoading || approveLoading}
              className="px-4 py-2 border border-red-300 text-red-700 bg-white rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {denyLoading ? 'Denying...' : 'Deny Request'}
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={approveLoading || denyLoading}
              className="px-4 py-2 bg-green-600 border border-transparent rounded-md text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {approveLoading ? 'Approving...' : 'Approve Request'}
            </button>
          </div>
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
        ) : !data || data.pendingTimeOffRequests.edges.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No pending time-off requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date(s)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.pendingTimeOffRequests.edges.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {request.staff?.profile?.avatar ? (
                          <img src={request.staff.profile.avatar} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-xs font-medium">
                              {request.staff?.firstName?.charAt(0) || ''}
                              {request.staff?.lastName?.charAt(0) || ''}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{request.staff?.firstName} {request.staff?.lastName}</div>
                          <div className="text-sm text-gray-500">{request.staff?.profile?.title || 'Staff Member'}</div>
                        </div>
                      </div>
                    </td>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {data && data.pendingTimeOffRequests.totalCount > pageSize && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!data.pendingTimeOffRequests.pageInfo.hasPreviousPage}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="text-sm text-gray-700">
                Page {currentPage}
              </div>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={!data.pendingTimeOffRequests.pageInfo.hasNextPage}
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

export default TimeOffApprovalList; 