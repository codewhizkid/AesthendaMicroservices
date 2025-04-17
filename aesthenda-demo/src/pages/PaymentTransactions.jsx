import React from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import PaymentDashboard from '../components/payment/PaymentDashboard';

const PaymentTransactions = () => {
  return (
    <DashboardLayout title="Payment Transactions">
      <PaymentDashboard />
    </DashboardLayout>
  );
};

export default PaymentTransactions; 