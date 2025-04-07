import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import RegistrationSuccess from './pages/RegistrationSuccess';
import PlanSelection from './pages/PlanSelection';
import Payment from './pages/Payment';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import StaffManagement from './pages/StaffManagement';
import SalonSettings from './pages/SalonSettings';
import AppointmentManagement from './pages/AppointmentManagement';

// Route guards
import PrivateRoute from './components/PrivateRoute';

// Wrapper for Login when accessed directly via URL (not in modal)
const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Login />
    </div>
  );
};

// Wrapper for Register when accessed directly via URL (not in modal)
const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Register />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TenantProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/registration-success" element={<RegistrationSuccess />} />
            
            {/* Registration and onboarding flow */}
            <Route 
              path="/plan-selection" 
              element={
                <PrivateRoute>
                  <PlanSelection />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/payment" 
              element={
                <PrivateRoute>
                  <Payment />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/onboarding" 
              element={
                <PrivateRoute>
                  <Onboarding />
                </PrivateRoute>
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/dashboard/appointments" 
              element={
                <PrivateRoute>
                  <AppointmentManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/dashboard/staff" 
              element={
                <PrivateRoute>
                  <StaffManagement />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/dashboard/settings" 
              element={
                <PrivateRoute>
                  <SalonSettings />
                </PrivateRoute>
              } 
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TenantProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;