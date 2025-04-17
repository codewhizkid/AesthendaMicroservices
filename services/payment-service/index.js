const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Import services
const paymentService = require('./services/paymentService');
const tenantPaymentService = require('./services/tenantPaymentService');

// Import controllers
const webhookController = require('./controllers/webhookController');
const webhookEventsController = require('./controllers/webhookEventsController');
const testWebhookController = require('./controllers/testWebhookController');

// Import RabbitMQ utilities
const { connectToRabbitMQ } = require('./utils/rabbitmq');

// Create Express app
const app = express();

// Middleware
app.use(cors());

// Special raw body parser for webhooks
const webhookBodyParser = bodyParser.raw({ type: 'application/json' });

// Standard body parsers for other routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo-payment:27017/paymentdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('💰 MongoDB Connected'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Basic auth middleware for admin routes
const requireAuth = (req, res, next) => {
  // A simple middleware just for demo purposes
  // In a production environment, use proper JWT auth
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Extract token from header
  const authHeader = req.headers.authorization;
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid authentication format' });
  }
  
  // This is a simple demo implementation - in production, use proper JWT verification
  // For now, we just check if a token exists
  const token = authHeader.substring(7);
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }
  
  // Set the tenant ID from the request for service use
  if (req.params.tenantId) {
    req.tenantId = req.params.tenantId;
  }
  
  // Set a dummy user ID for audit logs
  req.userId = 'user_demo123';
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Payment service is healthy' });
});

// Tenant payment configuration endpoints
app.get('/api/tenants/:tenantId/payment-config', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const config = await tenantPaymentService.getTenantConfig(tenantId);
    res.json(config);
  } catch (error) {
    console.error('Error getting tenant payment config:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tenants/:tenantId/payment-config', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const configData = req.body;
    const updatedConfig = await tenantPaymentService.updateTenantConfig(tenantId, configData);
    res.json(updatedConfig);
  } catch (error) {
    console.error('Error updating tenant payment config:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tenants/:tenantId/payment-config/test', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { provider, credentials } = req.body;
    const result = await tenantPaymentService.testProviderConnection(tenantId, provider, credentials);
    res.json({ success: true, message: 'Connection successful', result });
  } catch (error) {
    console.error('Error testing payment provider connection:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Client-side configuration endpoint
app.get('/api/tenants/:tenantId/payment-config/client', async (req, res) => {
  try {
    const clientConfig = await paymentService.getClientConfig(req.params.tenantId);
    res.json(clientConfig);
  } catch (error) {
    console.error('Error getting client payment config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payment processing endpoints
app.post('/api/tenants/:tenantId/payments', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const result = await paymentService.processPayment(tenantId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/tenants/:tenantId/payments/:paymentId/complete', async (req, res) => {
  try {
    const { tenantId, paymentId } = req.params;
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }
    
    const result = await paymentService.completePayment(tenantId, paymentId, paymentMethodId);
    res.json(result);
  } catch (error) {
    console.error('Error completing payment:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/tenants/:tenantId/payments/:paymentId/refund', requireAuth, async (req, res) => {
  try {
    const { tenantId, paymentId } = req.params;
    const { amount, reason } = req.body;
    
    const result = await paymentService.refundPayment(tenantId, paymentId, amount, reason);
    res.json(result);
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/tenants/:tenantId/payments/:paymentId', async (req, res) => {
  try {
    const { tenantId, paymentId } = req.params;
    const result = await paymentService.getPaymentStatus(tenantId, paymentId);
    res.json(result);
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(400).json({ error: error.message });
  }
});

// For backwards compatibility - these will be deprecated
app.post('/process-payment', (req, res) => {
  console.warn('DEPRECATED: Using /process-payment route. Please update to tenant-specific endpoint.');
  const { tenantId, appointmentId, amount, paymentMethod } = req.body;

  if (!tenantId || !appointmentId || !amount || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Redirect to the new endpoint
  req.params.tenantId = tenantId;
  req.body = {
    appointmentId,
    amount,
    paymentMethod,
    customerId: req.body.customerId || 'legacy_customer'
  };
  
  // Call the tenant-specific endpoint
  return paymentService.processPayment(tenantId, req.body)
    .then(result => res.json(result))
    .catch(error => res.status(400).json({ error: error.message }));
});

// Payment provider webhook endpoints
app.post('/api/webhooks/stripe/:tenantId', webhookBodyParser, webhookController.handleStripeWebhook);
app.post('/api/webhooks/square/:tenantId', webhookBodyParser, webhookController.handleSquareWebhook);
app.post('/api/webhooks/paypal/:tenantId', webhookBodyParser, webhookController.handlePayPalWebhook);

// Webhook event routes for admin interface
app.get('/api/webhook-events', webhookEventsController.getWebhookEvents);
app.get('/api/webhook-events/stats', webhookEventsController.getWebhookEventStats);
app.get('/api/webhook-events/:id', webhookEventsController.getWebhookEventById);
app.post('/api/webhook-events/:id/retry', webhookEventsController.retryWebhookEvent);

// Add test webhook routes - only available in development environment
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-webhooks/options', testWebhookController.getTestWebhookOptions);
  app.post('/api/test-webhooks/stripe', testWebhookController.generateStripeTestEvent);
  app.post('/api/test-webhooks/square', testWebhookController.generateSquareTestEvent);
  app.post('/api/test-webhooks/paypal', testWebhookController.generatePayPalTestEvent);
  
  console.log('🔧 Test webhook endpoints enabled for development');
}

// Start server
const PORT = process.env.PORT || 5004;
app.listen(PORT, async () => {
  console.log(`💵 Payment service listening on port ${PORT}`);
  
  // Initialize RabbitMQ connection
  try {
    await connectToRabbitMQ();
    console.log('RabbitMQ integration initialized for payment events');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ connection:', error);
  }
}); 