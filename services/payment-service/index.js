const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://mongo-payment:27017/paymentdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Setup routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Payment service is healthy' });
});

// Mock payment endpoint (in production, this would integrate with a payment gateway like Stripe)
app.post('/process-payment', (req, res) => {
  const { appointmentId, amount, paymentMethod } = req.body;

  if (!appointmentId || !amount || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // In a real implementation, this would make a call to Stripe or another payment processor
  console.log(`Processing payment for appointment ${appointmentId}: $${amount}`);

  // Simulate payment processing
  setTimeout(() => {
    // Mock successful payment
    const transactionId = `txn_${Date.now()}`;
    
    res.status(200).json({
      success: true,
      transactionId,
      appointmentId,
      amount,
      timestamp: new Date().toISOString()
    });

    // In production, you would publish a message to RabbitMQ to notify other services
    console.log(`Payment successful: ${transactionId}`);
  }, 1000);
});

// Start server
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`Payment service listening on port ${PORT}`);
}); 