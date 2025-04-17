import React from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import PaymentDetail from '../components/payment/PaymentDetail';

const PaymentDetails = () => {
  return (
    <DashboardLayout title="Payment Details">
      <PaymentDetail />
    </DashboardLayout>
  );
};

export default PaymentDetails; 