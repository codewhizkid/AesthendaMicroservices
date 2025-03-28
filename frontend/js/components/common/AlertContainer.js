import React from 'react';
import { useAdminContext } from '../../context/AdminContext';

const AlertContainer = () => {
  const { state } = useAdminContext();
  const { alerts } = state;

  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md">
      {alerts.map((alert) => (
        <div 
          key={alert.id}
          className={`px-4 py-3 rounded-md shadow-md flex items-center animate-fade-in 
            ${alert.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 
              alert.type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' : 
              alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500' : 
              'bg-blue-50 text-blue-800 border-l-4 border-blue-500'}`}
          role="alert"
        >
          {/* Alert icon based on type */}
          {alert.type === 'success' && (
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {alert.type === 'error' && (
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {alert.type === 'warning' && (
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {alert.type === 'info' && (
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  );
};

export default AlertContainer;

// Add this CSS to your global styles or use a style-in-js solution
// @keyframes fadeIn {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in {
//   animation: fadeIn 0.3s ease-out forwards;
// }