import React from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import WebhookEventsViewer from '../components/payment/WebhookEventsViewer';
import TestWebhookGenerator from '../components/payment/TestWebhookGenerator';

const WebhookEvents = () => {
  return (
    <DashboardLayout title="Payment Webhook Events">
      {/* Show test webhook generator only in development mode */}
      {process.env.NODE_ENV !== 'production' && <TestWebhookGenerator />}
      <WebhookEventsViewer />
    </DashboardLayout>
  );
};

export default WebhookEvents; 