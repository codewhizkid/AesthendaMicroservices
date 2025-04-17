import React, { useState, useContext } from 'react';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { AuthContext } from '../context/AuthContext';
import TimeOffRequestsList from '../components/staff/TimeOffRequestsList';
import TimeOffApprovalList from '../components/admin/TimeOffApprovalList';
import { Tab } from '@headlessui/react';

const GET_USER_ROLE = gql`
  query GetUserRole {
    currentUser {
      id
      role
    }
  }
`;

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const StaffSchedule = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState(0);
  
  const { loading, error, data } = useQuery(GET_USER_ROLE);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <svg className="animate-spin h-10 w-10 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-red-600">
          <p>Error: {error.message}</p>
        </div>
      </div>
    );
  }
  
  const isAdmin = data?.currentUser?.role === 'ADMIN' || data?.currentUser?.role === 'MANAGER';
  
  // Define tabs based on role
  const tabs = [
    { name: 'My Time Off', component: <TimeOffRequestsList userId={user?.id} /> },
  ];
  
  // Add additional tabs for admins
  if (isAdmin) {
    tabs.push(
      { name: 'Time Off Requests', component: <TimeOffApprovalList /> },
      // Add more admin tabs here as we develop them
      // { name: 'Staff Availability', component: <StaffAvailabilityManager /> },
      // { name: 'Schedule Calendar', component: <StaffScheduleCalendar /> },
    );
  }
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Staff Schedule Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage staff time-off requests, schedules, and availability
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 sm:px-6">
          <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
            <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
              {tabs.map((tab, idx) => (
                <Tab
                  key={idx}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white shadow text-primary-600'
                        : 'text-gray-600 hover:bg-white/[0.12] hover:text-primary-500'
                    )
                  }
                >
                  {tab.name}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-4">
              {tabs.map((tab, idx) => (
                <Tab.Panel
                  key={idx}
                  className={classNames(
                    'rounded-xl py-3',
                    'ring-white ring-opacity-60 focus:outline-none'
                  )}
                >
                  {tab.component}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Need help managing staff schedules? Check out our{' '}
          <a
            href="#"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Staff Schedule Management Guide
          </a>
        </p>
      </div>
    </div>
  );
};

export default StaffSchedule; 