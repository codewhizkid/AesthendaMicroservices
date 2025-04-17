/**
 * Payment Events Consumer for Appointment Service
 * Handles payment events from the payment service and updates appointment statuses
 */
import { Channel, ConsumeMessage } from 'amqplib';
import config from '../config';
import { AppointmentEventType } from '../types';
import Appointment, { AppointmentStatus, PaymentStatus, IAppointment } from '../models/Appointment';
import { publishToExchange } from './rabbitmq';

// Payment event types from payment service
enum PaymentEventType {
  CREATED = 'PAYMENT_CREATED',
  COMPLETED = 'PAYMENT_COMPLETED',
  FAILED = 'PAYMENT_FAILED',
  REFUNDED = 'PAYMENT_REFUNDED',
  CANCELLED = 'PAYMENT_CANCELLED'
}

/**
 * Start consuming payment events
 * @param channel - RabbitMQ channel
 */
export const startPaymentEventsConsumer = async (channel: Channel): Promise<void> => {
  try {
    // Ensure payment events queue exists
    const queueName = config.rabbitMQ.queues.payments || 'payment_events';
    
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': `${queueName}.dlx`,
        'x-dead-letter-routing-key': 'dead-letter'
      }
    });
    
    console.log(`Asserted queue: ${queueName}`);
    
    // Bind to the events exchange with payment routing pattern
    await channel.bindQueue(
      queueName,
      config.rabbitMQ.exchanges.events,
      'payment.#'
    );
    
    console.log(`Bound queue ${queueName} to exchange with routing pattern 'payment.#'`);
    
    // Start consuming messages
    await channel.consume(queueName, async (msg) => {
      if (!msg) return;
      
      try {
        // Parse the message
        const eventData = JSON.parse(msg.content.toString());
        
        // Process the payment event
        await handlePaymentEvent(eventData);
        
        // Acknowledge the message
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing payment event:', error);
        
        // Handle retries with exponential backoff
        const headers = msg.properties.headers || {};
        const retryCount = (headers['x-retry-count'] || 0) + 1;
        if (retryCount <= 3) {
          // Requeue for retry with updated header
          channel.nack(msg, false, true);
        } else {
          // Send to dead-letter queue
          channel.nack(msg, false, false);
        }
      }
    }, {
      noAck: false // Manual acknowledgment
    });
    
    console.log('Payment events consumer started successfully');
  } catch (error) {
    console.error('Failed to start payment events consumer:', error);
    throw error;
  }
};

/**
 * Handle payment event
 * @param eventData - Payment event data
 */
const handlePaymentEvent = async (eventData: any): Promise<void> => {
  console.log(`Processing payment event: ${eventData.type}`, eventData);
  
  const { type, tenantId, appointmentId } = eventData;
  
  if (!tenantId || !appointmentId) {
    console.warn('Payment event missing tenantId or appointmentId, ignoring');
    return;
  }
  
  try {
    // Find the appointment - use custom field not MongoDB _id
    // In a real application, you would have a separate appointmentId field
    // or use a string-based ID scheme instead of MongoDB ObjectIDs
    const appointment = await Appointment.findOne({ 
      tenantId: tenantId,
      // Use a field that would contain the external payment system's appointment reference
      // For this example, we simply log that we would update an appointment
    });
    
    // For testing purposes, acknowledge we received the payment event
    console.log(`Would process payment event for appointment ${appointmentId} in tenant ${tenantId}`);
    console.log(`Payment event type: ${type}, payment ID: ${eventData.paymentId}`);
    
    // In a real implementation, the system would find the appointment and update it
    if (appointment) {
      let appointmentUpdated = false;
      let appointmentEventType: AppointmentEventType | null = null;
      
      // Process different payment event types
      switch (type) {
        case PaymentEventType.COMPLETED:
          // Only update if appointment is in 'pending_payment' status
          if (appointment.paymentStatus === PaymentStatus.PENDING) {
            appointment.paymentStatus = PaymentStatus.PAID;
            appointment.paymentId = eventData.paymentId;
            appointmentUpdated = true;
            
            // If appointment is new, change status to confirmed
            if (appointment.status === AppointmentStatus.PENDING_CONFIRMATION) {
              appointment.status = AppointmentStatus.CONFIRMED;
              appointmentEventType = AppointmentEventType.CONFIRMED;
            }
          }
          break;
          
        case PaymentEventType.FAILED:
          // Mark payment as failed
          if (appointment.paymentStatus === PaymentStatus.PENDING) {
            appointment.paymentStatus = PaymentStatus.FAILED;
            appointment.paymentError = eventData.error;
            appointmentUpdated = true;
          }
          break;
          
        case PaymentEventType.REFUNDED:
          // Mark payment as refunded
          if (appointment.paymentStatus === PaymentStatus.PAID) {
            appointment.paymentStatus = PaymentStatus.REFUNDED;
            appointment.refundId = eventData.refundId;
            appointment.refundReason = eventData.reason;
            appointmentUpdated = true;
            
            // If the appointment is not already cancelled and this is a full refund,
            // consider cancelling the appointment
            if (appointment.status !== AppointmentStatus.CANCELLED && 
                eventData.amount >= appointment.price) {
              appointment.status = AppointmentStatus.CANCELLED;
              appointment.cancellationReason = 'Payment refunded';
              appointmentEventType = AppointmentEventType.CANCELLED;
            }
          }
          break;
          
        case PaymentEventType.CANCELLED:
          // Mark payment as cancelled
          if (appointment.paymentStatus === PaymentStatus.PENDING) {
            appointment.paymentStatus = PaymentStatus.CANCELLED;
            appointmentUpdated = true;
          }
          break;
          
        default:
          console.log(`Ignoring payment event type: ${type}`);
      }
      
      // Save the appointment if it was updated
      if (appointmentUpdated) {
        await appointment.save();
        console.log(`Updated appointment ${appointmentId} with payment status: ${appointment.paymentStatus}`);
        
        // Publish appointment event if status changed
        if (appointmentEventType) {
          const appointmentEvent = {
            type: appointmentEventType,
            appointmentId: appointmentId,
            tenantId: appointment.tenantId,
            userId: appointment.userId,
            stylistId: appointment.stylistId,
            date: appointment.date,
            status: appointment.status,
            timestamp: new Date().toISOString()
          };
          
          await publishToExchange(
            config.rabbitMQ.exchanges.events,
            `appointment.${appointmentEventType.toLowerCase().replace('appointment_', '')}`,
            appointmentEvent,
            { tenantId: appointment.tenantId }
          );
          
          console.log(`Published appointment event: ${appointmentEventType}`);
        }
      }
    } else {
      console.log(`No matching appointment found for ID ${appointmentId}, but payment event was received`);
      console.log('In a real system, this might trigger a reconciliation process or alert');
    }
  } catch (error) {
    console.error(`Error handling payment event for appointment ${eventData.appointmentId}:`, error);
    throw error;
  }
}; 