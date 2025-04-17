/**
 * Test script for RabbitMQ integration
 * 
 * To run: npx ts-node src/utils/test-rabbitmq.ts
 */
import { connectToRabbitMQ, publishToExchange, closeRabbitMQConnection } from './rabbitmq';
import { AppointmentEventType } from '../types';
import config from '../config';

// Sample data to publish
const testEvent = {
  type: AppointmentEventType.CREATED,
  appointmentId: 'test-appointment-id',
  tenantId: 'test-tenant-id',
  userId: 'test-user-id',
  stylistId: 'test-stylist-id',
  date: new Date().toISOString(),
  status: 'scheduled',
  timestamp: new Date().toISOString(),
};

async function testRabbitMQIntegration() {
  try {
    console.log('Connecting to RabbitMQ...');
    const connected = await connectToRabbitMQ();
    
    if (!connected) {
      console.error('Failed to connect to RabbitMQ');
      process.exit(1);
    }
    
    console.log('Connected to RabbitMQ successfully');
    
    // Publish test message
    console.log('Publishing test event:', testEvent);
    const result = await publishToExchange(
      config.rabbitMQ.exchanges.events,
      'appointment.created',
      testEvent,
      { tenantId: testEvent.tenantId }
    );
    
    console.log('Publish result:', result);
    
    // Close connection
    console.log('Closing connection...');
    await closeRabbitMQConnection();
    console.log('Test completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

// Run the test
testRabbitMQIntegration(); 