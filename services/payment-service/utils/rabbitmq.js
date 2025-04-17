/**
 * RabbitMQ Integration Module for Payment Service
 */
const amqp = require('amqplib');

// Constants for RabbitMQ configuration
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const EVENTS_EXCHANGE = process.env.RABBITMQ_EVENTS_EXCHANGE || 'appointment_events';
const PAYMENT_EVENTS_QUEUE = process.env.RABBITMQ_PAYMENT_QUEUE || 'payment_events';

// Connection state - singleton pattern
const state = {
  connection: null,
  channel: null,
  isConnected: false,
  reconnectAttempts: 0,
  isConnecting: false
};

// Max reconnect attempts and delay calculation
const MAX_RECONNECT_ATTEMPTS = 10;
const getReconnectDelay = (attempt) => {
  return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
};

/**
 * Connect to RabbitMQ
 * @returns {Promise<boolean>} Connection success state
 */
const connectToRabbitMQ = async () => {
  // If already connected, return immediately
  if (state.isConnected && state.channel) {
    return true;
  }

  // If already attempting to connect, wait for it to complete
  if (state.isConnecting) {
    // Wait for 100ms and check again
    await new Promise(resolve => setTimeout(resolve, 100));
    return state.isConnected;
  }

  state.isConnecting = true;

  try {
    console.log(`Connecting to RabbitMQ: ${RABBITMQ_URL}`);

    // Connect to RabbitMQ
    const connection = await amqp.connect(RABBITMQ_URL);
    state.connection = connection;
    
    const channel = await connection.createChannel();
    state.channel = channel;
    state.isConnected = true;
    state.reconnectAttempts = 0;
    state.isConnecting = false;

    console.log("Connected to RabbitMQ successfully");

    // Set up error handlers
    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
      state.isConnected = false;
      // Don't try to reconnect here, let the "close" event handle it
    });

    connection.on("close", async () => {
      console.warn("RabbitMQ connection closed. Attempting to reconnect...");
      state.isConnected = false;
      state.channel = null;
      state.connection = null;
      state.isConnecting = false;

      // Attempt to reconnect
      if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        state.reconnectAttempts++;
        const delay = getReconnectDelay(state.reconnectAttempts);
        console.log(`Attempting reconnect in ${delay}ms (attempt ${state.reconnectAttempts})`);
        
        setTimeout(async () => {
          try {
            await connectToRabbitMQ();
          } catch (error) {
            console.error("Failed to reconnect to RabbitMQ:", error);
          }
        }, delay);
      } else {
        console.error(
          `Failed to reconnect to RabbitMQ after ${MAX_RECONNECT_ATTEMPTS} attempts.`
        );
      }
    });

    // Setup queues and exchanges
    await setupQueuesAndExchanges();
    return true;
  } catch (error) {
    state.isConnecting = false;
    console.error("Failed to connect to RabbitMQ:", error);
    
    // Attempt to reconnect
    if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      state.reconnectAttempts++;
      const delay = getReconnectDelay(state.reconnectAttempts);
      console.log(`Attempting reconnect in ${delay}ms (attempt ${state.reconnectAttempts})`);
      
      setTimeout(async () => {
        try {
          await connectToRabbitMQ();
        } catch (connectionError) {
          console.error("Failed to reconnect to RabbitMQ:", connectionError);
        }
      }, delay);
    } else {
      console.error(
        `Failed to connect to RabbitMQ after ${MAX_RECONNECT_ATTEMPTS} attempts.`
      );
    }
    return false;
  }
};

/**
 * Set up queues and exchanges
 * @returns {Promise<void>}
 */
const setupQueuesAndExchanges = async () => {
  if (!state.channel) {
    throw new Error("RabbitMQ channel not initialized");
  }

  try {
    // First, try to delete the queue if it exists to avoid argument conflicts
    try {
      await state.channel.deleteQueue(PAYMENT_EVENTS_QUEUE);
      console.log(`Deleted existing queue ${PAYMENT_EVENTS_QUEUE} to recreate with correct parameters`);
    } catch (error) {
      console.log(`Queue ${PAYMENT_EVENTS_QUEUE} did not exist or could not be deleted, will try to create`);
    }

    // Declare payment events queue with dead letter exchange
    await state.channel.assertQueue(PAYMENT_EVENTS_QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': `${PAYMENT_EVENTS_QUEUE}.dlx`,
        'x-dead-letter-routing-key': 'dead-letter'
      }
    });
    
    console.log(`Created queue ${PAYMENT_EVENTS_QUEUE} with dead letter configuration`);
    
    // Create dead-letter queue for failed messages
    const dlqName = `${PAYMENT_EVENTS_QUEUE}.dlq`;
    await state.channel.assertQueue(dlqName, { durable: true });
    
    // Create dead-letter exchange
    const dlxName = `${PAYMENT_EVENTS_QUEUE}.dlx`;
    await state.channel.assertExchange(dlxName, 'direct', { durable: true });
    
    // Bind dead-letter queue to dead-letter exchange
    await state.channel.bindQueue(dlqName, dlxName, 'dead-letter');

    // Assert the events exchange exists (topic exchange)
    await state.channel.assertExchange(EVENTS_EXCHANGE, 'topic', { durable: true });

    // Bind the payment events queue to the exchange with a 'payment.*' pattern
    await state.channel.bindQueue(PAYMENT_EVENTS_QUEUE, EVENTS_EXCHANGE, 'payment.#');

    console.log("RabbitMQ queues and exchanges set up successfully");
  } catch (error) {
    console.error("Error setting up RabbitMQ queues and exchanges:", error);
    throw error;
  }
};

/**
 * Ensure connection to RabbitMQ
 * @returns {Promise<boolean>} Connection success state
 */
const ensureConnection = async () => {
  if (!state.channel || !state.isConnected) {
    return await connectToRabbitMQ();
  }
  return true;
};

/**
 * Publish a payment event to the events exchange
 * @param {string} eventType - Type of payment event
 * @param {Object} data - Event data
 * @param {Object} options - Publishing options
 * @returns {Promise<boolean>} Publishing success state
 */
const publishPaymentEvent = async (eventType, data, options = {}) => {
  const connected = await ensureConnection();
  if (!connected || !state.channel) {
    console.error("Failed to ensure RabbitMQ connection for publishing payment event");
    return false;
  }

  try {
    const tenantId = data.tenantId || options.tenantId;
    const routingKey = `payment.${eventType.toLowerCase()}`;

    const message = {
      type: eventType,
      ...data,
      timestamp: new Date().toISOString()
    };

    // Include tenant ID in headers if available
    const messageOptions = {
      persistent: true,
      headers: {
        "x-tenant-id": tenantId,
        ...options
      }
    };

    const result = state.channel.publish(
      EVENTS_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      messageOptions
    );
    
    if (result) {
      console.log(`Published payment event ${eventType} to exchange ${EVENTS_EXCHANGE}`);
    } else {
      console.warn(`Failed to publish payment event ${eventType}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error publishing payment event ${eventType}:`, error);
    return false;
  }
};

/**
 * Close RabbitMQ connection
 * @returns {Promise<void>}
 */
const closeRabbitMQConnection = async () => {
  try {
    // Prevent reconnection attempts during shutdown
    state.reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
    
    if (state.channel) {
      try {
        await state.channel.close();
        console.log("RabbitMQ channel closed successfully");
      } catch (channelError) {
        console.error("Error closing RabbitMQ channel:", channelError);
      }
      state.channel = null;
    }
    
    if (state.connection) {
      try {
        await state.connection.close();
        console.log("RabbitMQ connection closed successfully");
      } catch (connectionError) {
        console.error("Error closing RabbitMQ connection:", connectionError);
      }
      state.connection = null;
    }
    
    state.isConnected = false;
    state.isConnecting = false;
  } catch (error) {
    console.error("Error during RabbitMQ shutdown:", error);
  }
};

// Payment event types
const PaymentEventType = {
  CREATED: 'PAYMENT_CREATED',
  COMPLETED: 'PAYMENT_COMPLETED',
  FAILED: 'PAYMENT_FAILED',
  REFUNDED: 'PAYMENT_REFUNDED',
  CANCELLED: 'PAYMENT_CANCELLED'
};

module.exports = {
  connectToRabbitMQ,
  publishPaymentEvent,
  closeRabbitMQConnection,
  PaymentEventType
}; 