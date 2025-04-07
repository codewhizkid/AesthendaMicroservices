const amqp = require('amqplib');

let connection = null;
let channel = null;

const EXCHANGE_NAME = 'appointment_events';
const RETRY_EXCHANGE = 'appointment_events.retry';
const DEAD_LETTER_EXCHANGE = 'appointment_events.dlx';

const QUEUES = {
  NOTIFICATIONS: 'appointment_notifications',
  PAYMENTS: 'appointment_payments',
  ANALYTICS: 'appointment_analytics'
};

const RETRY_DELAYS = [1000, 5000, 15000, 30000, 60000]; // Retry delays in milliseconds

/**
 * Initialize RabbitMQ connection and channels
 */
const initialize = async () => {
  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();

    // Create exchanges
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertExchange(RETRY_EXCHANGE, 'direct', { durable: true });
    await channel.assertExchange(DEAD_LETTER_EXCHANGE, 'direct', { durable: true });

    // Create queues with dead-letter and retry configuration
    for (const [queueName, routingKey] of Object.entries(QUEUES)) {
      // Create retry queue
      const retryQueue = `${queueName}.retry`;
      await channel.assertQueue(retryQueue, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': EXCHANGE_NAME,
          'x-dead-letter-routing-key': routingKey,
          'x-message-ttl': RETRY_DELAYS[0] // First retry delay
        }
      });
      await channel.bindQueue(retryQueue, RETRY_EXCHANGE, routingKey);

      // Create dead-letter queue
      const deadLetterQueue = `${queueName}.dlx`;
      await channel.assertQueue(deadLetterQueue, { durable: true });
      await channel.bindQueue(deadLetterQueue, DEAD_LETTER_EXCHANGE, routingKey);

      // Create main queue
      await channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': RETRY_EXCHANGE,
          'x-dead-letter-routing-key': routingKey
        }
      });
      await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);
    }

    console.log('🐰 RabbitMQ connection established');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
    throw error;
  }
};

/**
 * Publish an event to RabbitMQ
 * @param {string} eventType - Type of event (e.g., 'appointment.created')
 * @param {Object} data - Event data
 * @returns {Promise<void>}
 */
const publishEvent = async (eventType, data) => {
  try {
    if (!channel) {
      await initialize();
    }

    const message = {
      eventType,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    // Determine routing key based on event type
    let routingKey;
    if (eventType.startsWith('appointment.')) {
      routingKey = QUEUES.NOTIFICATIONS;
      
      // Also send to payments queue if payment-related
      if (eventType.includes('payment')) {
        await channel.publish(
          EXCHANGE_NAME,
          QUEUES.PAYMENTS,
          Buffer.from(JSON.stringify(message)),
          { persistent: true }
        );
      }
      
      // Send to analytics queue for all events
      await channel.publish(
        EXCHANGE_NAME,
        QUEUES.ANALYTICS,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
    }

    // Publish to main exchange
    await channel.publish(
      EXCHANGE_NAME,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    console.error('Failed to publish event:', error);
    throw error;
  }
};

/**
 * Subscribe to events
 * @param {string} queueName - Queue to subscribe to
 * @param {Function} handler - Event handler function
 * @returns {Promise<void>}
 */
const subscribeToEvents = async (queueName, handler) => {
  try {
    if (!channel) {
      await initialize();
    }

    await channel.consume(queueName, async (msg) => {
      try {
        const message = JSON.parse(msg.content.toString());
        await handler(message);
        channel.ack(msg);
      } catch (error) {
        console.error(`Error processing message from ${queueName}:`, error);

        // Handle retries
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;
        const retryDelay = RETRY_DELAYS[retryCount - 1];

        if (retryCount <= RETRY_DELAYS.length) {
          // Publish to retry exchange with incremented retry count
          const retryMessage = {
            ...JSON.parse(msg.content.toString()),
            retryCount
          };

          await channel.publish(
            RETRY_EXCHANGE,
            msg.fields.routingKey,
            Buffer.from(JSON.stringify(retryMessage)),
            {
              persistent: true,
              headers: { 'x-retry-count': retryCount }
            }
          );
        } else {
          // Move to dead-letter queue if max retries exceeded
          await channel.publish(
            DEAD_LETTER_EXCHANGE,
            msg.fields.routingKey,
            msg.content,
            {
              persistent: true,
              headers: {
                'x-error': error.message,
                'x-failed-at': new Date().toISOString()
              }
            }
          );
        }

        channel.ack(msg);
      }
    });

    console.log(`Subscribed to ${queueName} queue`);
  } catch (error) {
    console.error(`Failed to subscribe to ${queueName}:`, error);
    throw error;
  }
};

/**
 * Close RabbitMQ connection
 */
const closeConnection = async () => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
    throw error;
  }
};

module.exports = {
  initialize,
  publishEvent,
  subscribeToEvents,
  closeConnection,
  QUEUES
};