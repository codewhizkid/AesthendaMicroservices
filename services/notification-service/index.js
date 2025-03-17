const express = require('express');
const amqp = require('amqplib');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// Mock email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'example@example.com',
    pass: 'password'
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Notification service is healthy' });
});

// RabbitMQ Connection
async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect('amqp://rabbitmq:5672');
    const channel = await connection.createChannel();
    
    const queueName = 'appointment_notifications';
    await channel.assertQueue(queueName);
    
    console.log('Connected to RabbitMQ, waiting for messages...');
    
    // Consume messages
    channel.consume(queueName, async (message) => {
      if (message) {
        try {
          const content = JSON.parse(message.content.toString());
          console.log('Received message:', content);
          
          // Process based on notification type
          switch(content.type) {
            case 'NEW_APPOINTMENT':
              await handleNewAppointment(content.data);
              break;
            case 'APPOINTMENT_UPDATE':
              await handleAppointmentUpdate(content.data);
              break;
            case 'APPOINTMENT_CANCELLATION':
              await handleAppointmentCancellation(content.data);
              break;
            default:
              console.log('Unknown message type:', content.type);
          }
          
          channel.ack(message);
        } catch (error) {
          console.error('Error processing message:', error);
          channel.nack(message);
        }
      }
    });
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    // Retry connection after delay
    setTimeout(connectToRabbitMQ, 5000);
  }
}

// Handler functions for different notification types
async function handleNewAppointment(data) {
  console.log('Sending new appointment notification for:', data);
  // In a real implementation, you would use the data to send an actual email
  // await sendEmail(data.userEmail, 'New Appointment Confirmation', `Your appointment has been scheduled for ${data.date} at ${data.time}`);
}

async function handleAppointmentUpdate(data) {
  console.log('Sending appointment update notification for:', data);
  // Similar to above, would send real email in production
}

async function handleAppointmentCancellation(data) {
  console.log('Sending appointment cancellation notification for:', data);
  // Similar to above, would send real email in production
}

// Start server and connect to RabbitMQ
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Notification service listening on port ${PORT}`);
  connectToRabbitMQ();
}); 