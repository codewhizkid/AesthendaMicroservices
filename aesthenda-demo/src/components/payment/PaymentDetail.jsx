import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tenantPaymentService from '../../api/tenantPaymentService';
import appointmentService from '../../api/appointmentService';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { format } from 'date-fns';

const PaymentDetail = () => {
  const { tenantId, paymentId } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  // Fetch payment and appointment details on component mount
  useEffect(() => {
    fetchPaymentDetails();
  }, [tenantId, paymentId]);

  const fetchPaymentDetails = async () => {
    setLoading(true);
    try {
      // Fetch payment details
      const paymentDetails = await tenantPaymentService.getPaymentDetails(tenantId, paymentId);
      setPayment(paymentDetails);
      
      // If payment has an appointment ID, fetch appointment details
      if (paymentDetails.appointmentId) {
        try {
          const appointmentDetails = await appointmentService.getAppointmentById(
            tenantId, 
            paymentDetails.appointmentId
          );
          setAppointment(appointmentDetails);
        } catch (appointmentError) {
          console.error('Error fetching appointment details:', appointmentError);
          // Don't set error state here, we still want to show payment details
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payment details:', err);
      setError('Failed to load payment details. Please try again.');
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMMM d, yyyy h:mm:ss a');
    } catch (error) {
      return dateString;
    }
  };

  // Get payment status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Open refund modal
  const openRefundModal = () => {
    if (payment) {
      setRefundAmount(payment.amount);
      setRefundReason('');
      setRefundModalOpen(true);
    }
  };

  // Close refund modal
  const closeRefundModal = () => {
    setRefundModalOpen(false);
  };

  // Process refund
  const processRefund = async () => {
    if (!payment || !refundReason) return;
    
    setProcessingRefund(true);
    try {
      await tenantPaymentService.refundPayment(
        tenantId, 
        payment.id, 
        {
          amount: refundAmount,
          reason: refundReason
        }
      );
      
      // Close modal and refresh payment details
      closeRefundModal();
      fetchPaymentDetails();
      
      // Show success message (you might want to add a toast notification system)
      console.log('Refund processed successfully');
    } catch (err) {
      console.error('Error processing refund:', err);
      setError(`Failed to process refund: ${err.message}`);
    } finally {
      setProcessingRefund(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="medium" />
        <span className="ml-2">Loading payment details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage message={error} />
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-700">Payment not found.</p>
        <div className="mt-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900"
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Payments
          </button>
          
          {payment.status === 'completed' && (
            <button
              onClick={openRefundModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Process Refund
            </button>
          )}
        </div>
        
        {/* Payment header card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Payment Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Payment ID: {payment.id}
              </p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(payment.status)}`}>
              {payment.status}
            </span>
          </div>
        </div>
        
        {/* Payment details */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction Information</h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Amount</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatCurrency(payment.amount, payment.currency)}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Payment Provider</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment.provider || 'Unknown'}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {payment.paymentMethod?.type || 'Not specified'} {payment.paymentMethod?.last4 && `(**** **** **** ${payment.paymentMethod.last4})`}
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(payment.createdAt)}
                </dd>
              </div>
              {payment.updatedAt && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(payment.updatedAt)}
                  </dd>
                </div>
              )}
              {payment.status === 'refunded' && payment.refundId && (
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Refund Information</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div>
                      <span className="font-medium">Refund ID:</span> {payment.refundId}
                    </div>
                    {payment.refundAmount && (
                      <div className="mt-1">
                        <span className="font-medium">Refund Amount:</span> {formatCurrency(payment.refundAmount, payment.currency)}
                      </div>
                    )}
                    {payment.refundReason && (
                      <div className="mt-1">
                        <span className="font-medium">Reason:</span> {payment.refundReason}
                      </div>
                    )}
                    {payment.refundedAt && (
                      <div className="mt-1">
                        <span className="font-medium">Refunded At:</span> {formatDate(payment.refundedAt)}
                      </div>
                    )}
                  </dd>
                </div>
              )}
              {payment.error && (
                <div className="bg-red-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-red-500">Error</dt>
                  <dd className="mt-1 text-sm text-red-700 sm:mt-0 sm:col-span-2">
                    {payment.error}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
        
        {/* Appointment details if available */}
        {appointment && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Related Appointment</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Appointment ID: {appointment.id}
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Customer</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {appointment.customer?.firstName} {appointment.customer?.lastName}<br />
                    {appointment.customer?.email}<br />
                    {appointment.customer?.phone}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(appointment.date)}<br />
                    {appointment.startTime} - {appointment.endTime}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Services</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {appointment.services && appointment.services.map((service) => (
                        <li key={service.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="ml-2 flex-1 w-0 truncate">
                              {service.name}
                            </span>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {formatCurrency(service.price)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Stylist</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {appointment.stylistName || 'Not specified'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </dd>
                </div>
                {appointment.notes && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {appointment.notes}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}
        
        {/* Provider-specific details if available */}
        {payment.providerDetails && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Provider Details</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <pre className="mt-1 text-sm text-gray-700 overflow-auto bg-gray-50 p-4 rounded-md">
                {JSON.stringify(payment.providerDetails, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
      
      {/* Refund Modal */}
      {refundModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Process Refund</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        You are about to refund payment #{payment.id.substring(0, 8)}...
                        for {formatCurrency(payment.amount, payment.currency)}.
                        This action cannot be undone.
                      </p>
                      
                      <div className="mt-4">
                        <label htmlFor="refundAmount" className="block text-sm font-medium text-gray-700">
                          Refund Amount
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            id="refundAmount"
                            name="refundAmount"
                            min="0"
                            max={payment.amount}
                            step="0.01"
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Maximum: {formatCurrency(payment.amount, payment.currency)}
                        </p>
                      </div>
                      
                      <div className="mt-4">
                        <label htmlFor="refundReason" className="block text-sm font-medium text-gray-700">
                          Reason for Refund
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="refundReason"
                            name="refundReason"
                            rows="3"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Enter reason for refund"
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={processRefund}
                  disabled={processingRefund || !refundReason || refundAmount <= 0}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    processingRefund || !refundReason || refundAmount <= 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  }`}
                >
                  {processingRefund ? 'Processing...' : 'Process Refund'}
                </button>
                <button
                  type="button"
                  onClick={closeRefundModal}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetail; 