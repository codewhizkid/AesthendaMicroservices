const express = require('express');
const amqp = require('amqplib');
const nodemailer = require('nodemailer');
const { EmailProvider } = require('./providers/email');
const { SMSProvider } = require('./providers/sms');
const { PushProvider } = require('./providers/push');
const { NotificationTemplate } = require('./templates');

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

class NotificationService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.emailProvider = new EmailProvider();
    this.smsProvider = new SMSProvider();
    this.pushProvider = new PushProvider();
    this.template = new NotificationTemplate();
  }

  async initialize() {
    try {
      // Connect to RabbitMQ
      this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      this.channel = await connection.createChannel();

      // Initialize notification providers
      await Promise.all([
        this.emailProvider.initialize(),
        this.smsProvider.initialize(),
        this.pushProvider.initialize()
      ]);

      // Setup queues and start consuming messages
      await this.setupQueues();
      await this.startConsumers();

      console.log('🔔 Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  async setupQueues() {
    const QUEUES = {
      APPOINTMENT_NOTIFICATIONS: 'appointment_notifications',
      MARKETING_NOTIFICATIONS: 'marketing_notifications',
      SYSTEM_NOTIFICATIONS: 'system_notifications'
    };

    // Ensure queues exist
    for (const queueName of Object.values(QUEUES)) {
      await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${queueName}.dlx`,
          'x-dead-letter-routing-key': 'dead-letter'
        }
      });

      // Create dead-letter queue
      await this.channel.assertQueue(`${queueName}.dlx`, { durable: true });
    }
  }

  async startConsumers() {
    // Handle appointment notifications
    await this.channel.consume('appointment_notifications', async (msg) => {
      try {
        const event = JSON.parse(msg.content.toString());
        await this.handleAppointmentNotification(event);
        this.channel.ack(msg);
      } catch (error) {
        console.error('Error processing appointment notification:', error);
        // Reject the message and requeue if it hasn't been retried too many times
        const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
        if (retryCount <= 3) {
          this.channel.nack(msg, false, true);
        } else {
          // Move to dead-letter queue
          this.channel.nack(msg, false, false);
        }
      }
    });

    // Handle marketing notifications
    await this.channel.consume('marketing_notifications', async (msg) => {
      try {
        const event = JSON.parse(msg.content.toString());
        await this.handleMarketingNotification(event);
        this.channel.ack(msg);
      } catch (error) {
        console.error('Error processing marketing notification:', error);
        this.channel.nack(msg, false, retryCount <= 3);
      }
    });

    // Handle system notifications
    await this.channel.consume('system_notifications', async (msg) => {
      try {
        const event = JSON.parse(msg.content.toString());
        await this.handleSystemNotification(event);
        this.channel.ack(msg);
      } catch (error) {
        console.error('Error processing system notification:', error);
        this.channel.nack(msg, false, retryCount <= 3);
      }
    });
  }

  async handleAppointmentNotification(event) {
    const { eventType, data } = event;

    switch (eventType) {
      case 'appointment.created':
        await this.sendAppointmentConfirmation(data);
        break;
      case 'appointment.updated':
        await this.sendAppointmentUpdate(data);
        break;
      case 'appointment.cancelled':
        await this.sendAppointmentCancellation(data);
        break;
      case 'appointment.reminder':
        await this.sendAppointmentReminder(data);
        break;
      default:
        console.warn(`Unhandled appointment event type: ${eventType}`);
    }
  }

  async sendAppointmentConfirmation(appointment) {
    const { client, stylist, date, startTime, services } = appointment;
    
    // Generate notification content
    const content = this.template.generateAppointmentConfirmation({
      clientName: `${client.firstName} ${client.lastName}`,
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      date,
      time: startTime,
      services: services.map(s => s.name).join(', '),
      totalPrice: services.reduce((sum, s) => sum + s.price, 0)
    });

    // Send notifications through all channels
    await Promise.all([
      this.emailProvider.send({
        to: client.email,
        subject: 'Appointment Confirmation',
        ...content
      }),
      this.smsProvider.send({
        to: client.phone,
        message: content.sms
      }),
      this.pushProvider.send({
        userId: client.id,
        title: 'Appointment Confirmed',
        body: content.push
      })
    ]);
  }

  async sendAppointmentReminder(appointment) {
    const { client, stylist, date, startTime } = appointment;
    
    const content = this.template.generateAppointmentReminder({
      clientName: `${client.firstName} ${client.lastName}`,
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      date,
      time: startTime
    });

    await Promise.all([
      this.emailProvider.send({
        to: client.email,
        subject: 'Appointment Reminder',
        ...content
      }),
      this.smsProvider.send({
        to: client.phone,
        message: content.sms
      })
    ]);
  }

  async sendAppointmentUpdate(appointment) {
    const { client, stylist, date, startTime, services } = appointment;
    
    const content = this.template.generateAppointmentUpdate({
      clientName: `${client.firstName} ${client.lastName}`,
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      date,
      time: startTime,
      services: services.map(s => s.name).join(', ')
    });

    await Promise.all([
      this.emailProvider.send({
        to: client.email,
        subject: 'Appointment Update',
        ...content
      }),
      this.smsProvider.send({
        to: client.phone,
        message: content.sms
      })
    ]);
  }

  async sendAppointmentCancellation(appointment) {
    const { client, stylist, date, startTime, cancellationReason } = appointment;
    
    const content = this.template.generateAppointmentCancellation({
      clientName: `${client.firstName} ${client.lastName}`,
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      date,
      time: startTime,
      reason: cancellationReason
    });

    await Promise.all([
      this.emailProvider.send({
        to: client.email,
        subject: 'Appointment Cancelled',
        ...content
      }),
      this.smsProvider.send({
        to: client.phone,
        message: content.sms
      })
    ]);
  }

  async handleMarketingNotification(event) {
    // Implementation for marketing notifications
  }

  async handleSystemNotification(event) {
    // Implementation for system notifications
  }

  async shutdown() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      await Promise.all([
        this.emailProvider.shutdown(),
        this.smsProvider.shutdown(),
        this.pushProvider.shutdown()
      ]);
      console.log('Notification service shut down');
    } catch (error) {
      console.error('Error shutting down notification service:', error);
      throw error;
    }
  }
}

// Create and start the service
const notificationService = new NotificationService();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal');
  await notificationService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT signal');
  await notificationService.shutdown();
  process.exit(0);
});

// Start the service
notificationService.initialize().catch(error => {
  console.error('Failed to start notification service:', error);
  process.exit(1);
});

// Start server and connect to RabbitMQ
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Notification service listening on port ${PORT}`);
}); 