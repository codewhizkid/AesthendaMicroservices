const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { EmailProvider } = require('./providers/email');
const { SMSProvider } = require('./providers/sms');
const { PushProvider } = require('./providers/push');
const { NotificationTemplate } = require('./templates');
const templateEngine = require('./templates/template-engine');

// Import middleware
const { authenticate, requireAuth, requireAdmin } = require('./middleware/authMiddleware');

// Load environment variables
require('dotenv').config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5003;

// JWT secret - should match the one used by the user service
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Middleware configuration
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    
    // TODO: In a production environment, you would validate against your user database
    // For demo purposes, we'll use a hardcoded admin user
    const validUsers = [
      {
        email: 'admin@aesthenda.com',
        password: 'Admin123!',
        id: '1',
        role: 'system_admin',
        tenantId: 'system'
      },
      {
        email: 'salon@example.com',
        password: 'Salon123!',
        id: '2',
        role: 'salon_admin',
        tenantId: 'tenant123'
      }
    ];
    
    // Find the user
    const user = validUsers.find(u => u.email === email);
    
    // Check password
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get current user info
app.get('/api/preview/user-info', requireAuth, (req, res) => {
  res.json({ 
    success: true, 
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      tenantId: req.user.tenantId
    }
  });
});

// Verify token route
app.get('/api/preview/verify-token', requireAuth, (req, res) => {
  res.json({ success: true });
});

// API routes for email template previews - now protected with authentication
app.post('/api/preview/email', requireAuth, async (req, res) => {
  try {
    const { templateType, data } = req.body;
    
    if (!templateType || !data) {
      return res.status(400).json({ error: 'Missing templateType or data' });
    }
    
    // Validate tenant ID
    if (!data.tenantId) {
      return res.status(400).json({ error: 'Missing tenantId in data' });
    }
    
    // Verify tenant access
    if (req.user.role !== 'system_admin' && req.user.tenantId !== data.tenantId) {
      return res.status(403).json({ 
        error: 'You do not have access to this tenant',
        success: false
      });
    }
    
    // Format the data for the template
    const templateData = {
      clientName: data.clientName || 'Sample Client',
      stylistName: data.stylistName || 'Sample Stylist',
      date: data.date || new Date().toISOString(),
      time: data.time || '10:00',
      formattedDate: data.formattedDate,
      formattedTime: data.formattedTime,
      services: data.services || 'Haircut',
      totalPrice: data.totalPrice || '75.00',
      tenantId: data.tenantId,
      tenantName: data.tenantName || 'Sample Salon',
      logoUrl: data.logoUrl || '',
      primaryColor: data.primaryColor || '#4A90E2',
      appointmentUrl: data.appointmentUrl || '#',
      tenantAddress: data.tenantAddress || '',
      tenantPhone: data.tenantPhone || '',
      tenantEmail: data.tenantEmail || '',
      reason: data.reason || '',
      changes: data.changes || [],
      specialInstructions: data.specialInstructions || ''
    };
    
    // If formattedDate and formattedTime weren't provided, generate them
    if (!templateData.formattedDate) {
      templateData.formattedDate = new Date(templateData.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    if (!templateData.formattedTime) {
      templateData.formattedTime = templateData.time.includes(':') ? templateData.time : 
        new Date(`${templateData.date.split('T')[0]}T${templateData.time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        });
    }
    
    // Render the template
    let html;
    switch (templateType) {
      case 'appointment-confirmation':
        html = templateEngine.renderAppointmentConfirmation(templateData);
        break;
      case 'appointment-reminder':
        html = templateEngine.renderAppointmentReminder(templateData);
        break;
      case 'appointment-cancelled':
        html = templateEngine.renderAppointmentCancelled(templateData);
        break;
      case 'appointment-updated':
        html = templateEngine.renderAppointmentUpdated(templateData);
        break;
      default:
        return res.status(400).json({ error: 'Invalid template type' });
    }
    
    res.json({ 
      success: true, 
      html,
      templateData
    });
  } catch (error) {
    console.error('Error rendering preview:', error);
    res.status(500).json({ error: 'Error rendering preview' });
  }
});

// Get list of available templates - now protected with authentication
app.get('/api/preview/templates', requireAuth, (req, res) => {
  const templates = [
    { 
      id: 'appointment-confirmation', 
      name: 'Appointment Confirmation', 
      description: 'Sent when a new appointment is booked'
    },
    { 
      id: 'appointment-reminder', 
      name: 'Appointment Reminder', 
      description: 'Sent before an upcoming appointment'
    },
    { 
      id: 'appointment-updated', 
      name: 'Appointment Update', 
      description: 'Sent when an appointment is modified'
    },
    { 
      id: 'appointment-cancelled', 
      name: 'Appointment Cancellation', 
      description: 'Sent when an appointment is cancelled'
    }
  ];
  
  res.json({ templates });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
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
      this.channel = await this.connection.createChannel();

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
    console.log('Setting up RabbitMQ queues and exchanges');
    
    try {
      // Get configuration from environment variables
      const queueName = process.env.RABBITMQ_NOTIFICATION_QUEUE || 'appointment_notifications';
      const exchangeName = process.env.RABBITMQ_EVENTS_EXCHANGE || 'appointment_events';
      
      // First, delete the queue if it exists to avoid argument conflicts
      try {
        await this.channel.deleteQueue(queueName);
        console.log(`Deleted existing queue ${queueName} to recreate with correct parameters`);
      } catch (error) {
        console.log(`Queue ${queueName} did not exist or could not be deleted, will try to create`);
      }
      
      // Ensure queues exist with dead letter exchange for failure handling
      await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': `${queueName}.dlx`,
          'x-dead-letter-routing-key': 'dead-letter'
        }
      });
      
      console.log(`Created queue ${queueName} with dead letter configuration`);
      
      // Create dead-letter queue for failed messages
      const dlqName = `${queueName}.dlq`;
      await this.channel.assertQueue(dlqName, { durable: true });
      
      // Create dead-letter exchange
      const dlxName = `${queueName}.dlx`;
      await this.channel.assertExchange(dlxName, 'direct', { durable: true });
      
      // Bind dead-letter queue to dead-letter exchange
      await this.channel.bindQueue(dlqName, dlxName, 'dead-letter');
      
      // Assert main exchange exists (will be created by appointment service,
      // but good to ensure it exists in case notification service starts first)
      await this.channel.assertExchange(exchangeName, 'topic', { durable: true });
      
      // Bind notification queue to exchange with correct routing pattern
      // This pattern will match all appointment events
      await this.channel.bindQueue(queueName, exchangeName, 'appointment.#');
      
      console.log(`Queue ${queueName} bound to exchange ${exchangeName} with routing pattern 'appointment.#'`);
    } catch (error) {
      console.error('Error setting up RabbitMQ queues and exchanges:', error);
      throw error;
    }
  }

  async startConsumers() {
    const queueName = process.env.RABBITMQ_NOTIFICATION_QUEUE || 'appointment_notifications';
    console.log(`Starting consumer for queue: ${queueName}`);
    
    // Handle appointment notifications
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;
      
      try {
        // Extract tenant ID from message headers if available
        const tenantId = msg.properties.headers && msg.properties.headers['x-tenant-id'];
        
        // Parse message content
        const event = JSON.parse(msg.content.toString());
        console.log(`Received message: ${msg.content.toString()}, tenant: ${tenantId}`);
        
        // If tenantId wasn't in headers, try to get it from the message body
        const eventTenantId = event.tenantId || tenantId;
        if (!eventTenantId) {
          console.warn('No tenant ID found in message headers or body. Using default.');
        }
        
        // Set tenant ID in the event object if it wasn't there
        if (!event.tenantId && eventTenantId) {
          event.tenantId = eventTenantId;
        }
        
        // Process the event
        await this.handleAppointmentNotification(event);
        
        // Acknowledge the message
        this.channel.ack(msg);
      } catch (error) {
        console.error('Error processing message:', error);
        
        // Retry logic - check if we should requeue
        const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
        if (retryCount <= 3) {
          console.log(`Retrying message, attempt ${retryCount}`);
          // Nack with requeue=true to retry
          this.channel.nack(msg, false, true);
        } else {
          console.warn(`Giving up on message after ${retryCount} attempts, sending to DLX`);
          // Nack with requeue=false to send to dead-letter queue
          this.channel.nack(msg, false, false);
        }
      }
    }, {
      // Consumer options
      noAck: false // Ensure we manually acknowledge messages
    });
    
    console.log('Message consumers started successfully');
  }

  async handleAppointmentNotification(event) {
    console.log('Received appointment event:', event);
    
    // Extract tenant ID from event
    const tenantId = event.tenantId;
    if (!tenantId) {
      throw new Error('Event missing required tenantId field');
    }
    
    // Map event type to handler
    switch (event.type) {
      case 'APPOINTMENT_CREATED':
        await this.handleAppointmentCreated(event, tenantId);
        break;
      case 'APPOINTMENT_UPDATED':
        await this.handleAppointmentUpdated(event, tenantId);
        break;
      case 'APPOINTMENT_CANCELLED':
        await this.handleAppointmentCancelled(event, tenantId);
        break;
      case 'APPOINTMENT_CONFIRMED':
        await this.handleAppointmentConfirmed(event, tenantId);
        break;
      case 'APPOINTMENT_COMPLETED':
        await this.handleAppointmentCompleted(event, tenantId);
        break;
      case 'APPOINTMENT_NO_SHOW':
        await this.handleAppointmentNoShow(event, tenantId);
        break;
      default:
        console.warn(`Unhandled appointment event type: ${event.type}`);
    }
  }
  
  async handleAppointmentCreated(event, tenantId) {
    console.log(`Processing appointment created event for tenant ${tenantId}`);
    
    try {
      // Fetch user and appointment details
      const userId = event.userId;
      const stylistId = event.stylistId;
      const appointmentId = event.appointmentId;
      
      // In a real implementation, we would:
      // 1. Fetch user details from user service using userId
      // 2. Fetch stylist details from user service using stylistId
      // 3. Fetch appointment details from appointment service using appointmentId
      // 4. Fetch tenant branding information using tenantId
      
      // For now, we'll use mock data
      const client = await this.mockFetchUserDetails(userId, tenantId);
      const stylist = await this.mockFetchStylistDetails(stylistId, tenantId);
      const appointmentDetails = await this.mockFetchAppointmentDetails(appointmentId, tenantId);
      
      // Generate notification using tenant-aware templates
      await this.sendAppointmentConfirmation({
        client,
        stylist,
        date: event.date,
        startTime: appointmentDetails.startTime,
        services: appointmentDetails.services,
        totalPrice: appointmentDetails.totalPrice,
        tenantId
      });
    } catch (error) {
      console.error('Error handling appointment created event:', error);
      throw error;
    }
  }
  
  async handleAppointmentUpdated(event, tenantId) {
    console.log(`Processing appointment updated event for tenant ${tenantId}`);
    
    try {
      // Fetch details (mock implementation)
      const client = await this.mockFetchUserDetails(event.userId, tenantId);
      const stylist = await this.mockFetchStylistDetails(event.stylistId, tenantId);
      const appointmentDetails = await this.mockFetchAppointmentDetails(event.appointmentId, tenantId);
      
      await this.sendAppointmentUpdate({
        client,
        stylist,
        date: event.date,
        startTime: appointmentDetails.startTime,
        services: appointmentDetails.services,
        tenantId
      });
    } catch (error) {
      console.error('Error handling appointment updated event:', error);
      throw error;
    }
  }
  
  async handleAppointmentCancelled(event, tenantId) {
    console.log(`Processing appointment cancelled event for tenant ${tenantId}`);
    
    try {
      // Fetch details (mock implementation)
      const client = await this.mockFetchUserDetails(event.userId, tenantId);
      const stylist = await this.mockFetchStylistDetails(event.stylistId, tenantId);
      const appointmentDetails = await this.mockFetchAppointmentDetails(event.appointmentId, tenantId);
      
      await this.sendAppointmentCancellation({
        client,
        stylist,
        date: event.date,
        startTime: appointmentDetails.startTime,
        cancellationReason: appointmentDetails.cancellationReason,
        tenantId
      });
    } catch (error) {
      console.error('Error handling appointment cancelled event:', error);
      throw error;
    }
  }
  
  async handleAppointmentConfirmed(event, tenantId) {
    console.log(`Processing appointment confirmed event for tenant ${tenantId}`);
    
    // Similar to created, but potentially with different template
    await this.handleAppointmentCreated(event, tenantId);
  }
  
  async handleAppointmentCompleted(event, tenantId) {
    console.log(`Processing appointment completed event for tenant ${tenantId}`);
    
    try {
      // Fetch details (mock implementation)
      const client = await this.mockFetchUserDetails(event.userId, tenantId);
      const stylist = await this.mockFetchStylistDetails(event.stylistId, tenantId);
      
      // Send thank you/feedback email
      await this.emailProvider.send({
        to: client.email,
        subject: 'Thank you for your visit!',
        html: `<p>Dear ${client.firstName},</p><p>Thank you for visiting us today! We hope you enjoyed your services with ${stylist.firstName}. Please consider leaving a review of your experience.</p>`,
        text: `Dear ${client.firstName}, Thank you for visiting us today! We hope you enjoyed your services with ${stylist.firstName}. Please consider leaving a review of your experience.`
      });
    } catch (error) {
      console.error('Error handling appointment completed event:', error);
      throw error;
    }
  }
  
  async handleAppointmentNoShow(event, tenantId) {
    console.log(`Processing appointment no-show event for tenant ${tenantId}`);
    
    try {
      // Fetch details (mock implementation)
      const client = await this.mockFetchUserDetails(event.userId, tenantId);
      const stylist = await this.mockFetchStylistDetails(event.stylistId, tenantId);
      
      // Send missed appointment notification
      await this.emailProvider.send({
        to: client.email,
        subject: 'Missed Appointment',
        html: `<p>Dear ${client.firstName},</p><p>It looks like you missed your appointment with ${stylist.firstName} today. Please contact us to reschedule at your convenience.</p>`,
        text: `Dear ${client.firstName}, It looks like you missed your appointment with ${stylist.firstName} today. Please contact us to reschedule at your convenience.`
      });
    } catch (error) {
      console.error('Error handling appointment no-show event:', error);
      throw error;
    }
  }
  
  // Mock methods for fetching data - in a real implementation, these would call the relevant services
  async mockFetchUserDetails(userId, tenantId) {
    console.log(`Fetching user details for userId ${userId}, tenantId ${tenantId}`);
    return {
      id: userId,
      firstName: 'Sample',
      lastName: 'Client',
      email: 'client@example.com',
      phone: '+15555555555'
    };
  }
  
  async mockFetchStylistDetails(stylistId, tenantId) {
    console.log(`Fetching stylist details for stylistId ${stylistId}, tenantId ${tenantId}`);
    return {
      id: stylistId,
      firstName: 'Sample',
      lastName: 'Stylist',
      email: 'stylist@example.com'
    };
  }
  
  async mockFetchAppointmentDetails(appointmentId, tenantId) {
    console.log(`Fetching appointment details for appointmentId ${appointmentId}, tenantId ${tenantId}`);
    return {
      id: appointmentId,
      startTime: '14:00',
      endTime: '15:00',
      services: ['Haircut', 'Styling'],
      totalPrice: 120.00,
      cancellationReason: 'Schedule conflict'
    };
  }

  async sendAppointmentConfirmation(appointment) {
    const { client, stylist, date, startTime, services, totalPrice, tenantId } = appointment;
    
    // Get tenant branding info (mock implementation)
    const tenantInfo = await this.mockFetchTenantInfo(tenantId);
    
    // Generate notification content with tenant branding
    const content = this.template.generateAppointmentConfirmation({
      clientName: `${client.firstName} ${client.lastName}`,
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      date,
      time: startTime,
      services: Array.isArray(services) ? services.join(', ') : services,
      totalPrice,
      salonName: tenantInfo.name,
      salonLogo: tenantInfo.logoUrl,
      primaryColor: tenantInfo.brandColor
    });

    console.log(`Sending appointment confirmation email to ${client.email} for tenant ${tenantId}`);

    // Send notifications through all channels
    await Promise.all([
      this.emailProvider.send({
        to: client.email,
        subject: `${tenantInfo.name}: Appointment Confirmation`,
        ...content
      }),
      client.phone ? this.smsProvider.send({
        to: client.phone,
        message: content.sms
      }) : Promise.resolve()
    ]);
  }

  async sendAppointmentReminder(appointment) {
    const { client, stylist, date, startTime, tenantId } = appointment;
    
    // Get tenant branding info
    const tenantInfo = await this.mockFetchTenantInfo(tenantId);
    
    const content = this.template.generateAppointmentReminder({
      clientName: `${client.firstName} ${client.lastName}`,
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      date,
      time: startTime,
      salonName: tenantInfo.name
    });

    console.log(`Sending appointment reminder to ${client.email} for tenant ${tenantId}`);

    await Promise.all([
      this.emailProvider.send({
        to: client.email,
        subject: `${tenantInfo.name}: Appointment Reminder`,
        ...content
      }),
      client.phone ? this.smsProvider.send({
        to: client.phone,
        message: content.sms
      }) : Promise.resolve()
    ]);
  }

  async sendAppointmentUpdate(appointment) {
    const { client, stylist, date, startTime, services, tenantId } = appointment;
    
    // Get tenant branding info
    const tenantInfo = await this.mockFetchTenantInfo(tenantId);
    
    const content = this.template.generateAppointmentUpdate({
      clientName: `${client.firstName} ${client.lastName}`,
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      date,
      time: startTime,
      services: Array.isArray(services) ? services.join(', ') : services,
      salonName: tenantInfo.name
    });

    console.log(`Sending appointment update to ${client.email} for tenant ${tenantId}`);

    await Promise.all([
      this.emailProvider.send({
        to: client.email,
        subject: `${tenantInfo.name}: Appointment Update`,
        ...content
      }),
      client.phone ? this.smsProvider.send({
        to: client.phone,
        message: content.sms
      }) : Promise.resolve()
    ]);
  }

  async sendAppointmentCancellation(appointment) {
    const { client, stylist, date, startTime, cancellationReason, tenantId } = appointment;
    
    // Get tenant branding info
    const tenantInfo = await this.mockFetchTenantInfo(tenantId);
    
    const content = this.template.generateAppointmentCancellation({
      clientName: `${client.firstName} ${client.lastName}`,
      stylistName: `${stylist.firstName} ${stylist.lastName}`,
      date,
      time: startTime,
      reason: cancellationReason,
      salonName: tenantInfo.name
    });

    console.log(`Sending appointment cancellation to ${client.email} for tenant ${tenantId}`);

    await Promise.all([
      this.emailProvider.send({
        to: client.email,
        subject: `${tenantInfo.name}: Appointment Cancelled`,
        ...content
      }),
      client.phone ? this.smsProvider.send({
        to: client.phone,
        message: content.sms
      }) : Promise.resolve()
    ]);
  }
  
  // Mock method to fetch tenant information
  async mockFetchTenantInfo(tenantId) {
    // In a real implementation, this would fetch tenant data from the tenant service
    console.log(`Fetching tenant info for tenantId ${tenantId}`);
    
    // Mock tenant data
    const tenants = {
      'default': {
        name: 'Aesthenda Salon & Spa',
        logoUrl: 'https://example.com/logos/default.png',
        brandColor: '#4A90E2',
        contactEmail: 'contact@aesthenda.com',
        contactPhone: '+15551234567',
        address: '123 Main St, City, State 12345'
      }
    };
    
    // Return tenant info or default if not found
    return tenants[tenantId] || tenants['default'];
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

// Start the server
app.listen(PORT, () => {
  console.log(`Notification service listening on port ${PORT}`);
  
  // Initialize the notification service
  const notificationService = new NotificationService();
  notificationService.initialize()
    .catch(error => {
      console.error('Failed to initialize notification service:', error);
      process.exit(1);
    });
}); 