/**
 * RabbitMQ Integration Module
 * Note: This is a minimal implementation to allow compilation
 */
import amqp from "amqplib";
import config from "../config";
import { AppointmentEventType } from "../types";
import { startPaymentEventsConsumer } from './paymentConsumer';

/**
 * RabbitMQ connection state
 */
interface RabbitMQState {
  connection: any; // Use any to bypass TypeScript issues with amqplib
  channel: any;    // Use any to bypass TypeScript issues with amqplib
  isConnected: boolean;
  reconnectAttempts: number;
  isConnecting: boolean;
}

// Singleton connection state
const state: RabbitMQState = {
  connection: null,
  channel: null,
  isConnected: false,
  reconnectAttempts: 0,
  isConnecting: false,
};

// Max reconnect attempts
const MAX_RECONNECT_ATTEMPTS = 10;

// Reconnect delay in ms (with exponential backoff)
const getReconnectDelay = (attempt: number): number => {
  return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
};

/**
 * Connect to RabbitMQ
 */
export const connectToRabbitMQ = async (): Promise<boolean> => {
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
    console.log(`Connecting to RabbitMQ: ${config.rabbitMQ.url}`);

    // Connect to RabbitMQ
    const connection = await amqp.connect(config.rabbitMQ.url);
    state.connection = connection;
    
    const channel = await connection.createChannel();
    state.channel = channel;
    state.isConnected = true;
    state.reconnectAttempts = 0;
    state.isConnecting = false;

    console.log("Connected to RabbitMQ successfully");

    // Set up error handlers
    connection.on("error", (err: Error) => {
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
 */
const setupQueuesAndExchanges = async (): Promise<void> => {
  if (!state.channel) {
    throw new Error("RabbitMQ channel not initialized");
  }

  try {
    // First, try to delete the queue if it exists to avoid argument conflicts
    const queueName = config.rabbitMQ.queues.notifications;
    try {
      await state.channel.deleteQueue(queueName);
      console.log(`Deleted existing queue ${queueName} to recreate with correct parameters`);
    } catch (error) {
      console.log(`Queue ${queueName} did not exist or could not be deleted, will try to create`);
    }

    // Declare queues with dead letter exchange for failure handling
    await state.channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': `${queueName}.dlx`,
        'x-dead-letter-routing-key': 'dead-letter'
      }
    });
    
    console.log(`Created queue ${queueName} with dead letter configuration`);
    
    // Create dead-letter queue for failed messages
    const dlqName = `${queueName}.dlq`;
    await state.channel.assertQueue(dlqName, { durable: true });
    
    // Create dead-letter exchange
    const dlxName = `${queueName}.dlx`;
    await state.channel.assertExchange(dlxName, 'direct', { durable: true });
    
    // Bind dead-letter queue to dead-letter exchange
    await state.channel.bindQueue(dlqName, dlxName, 'dead-letter');

    // Declare exchanges
    await state.channel.assertExchange(
      config.rabbitMQ.exchanges.events,
      "topic",
      { durable: true }
    );

    // Bind queues to exchanges if needed
    await state.channel.bindQueue(
      queueName,
      config.rabbitMQ.exchanges.events,
      "appointment.#"
    );

    console.log("RabbitMQ queues and exchanges set up successfully");

    // Start payment events consumer
    await startPaymentEventsConsumer(state.channel);
    
  } catch (error) {
    console.error("Error setting up RabbitMQ queues and exchanges:", error);
    throw error;
  }
};

/**
 * Ensure connection to RabbitMQ
 * Helper function to ensure connection before publishing
 */
const ensureConnection = async (): Promise<boolean> => {
  if (!state.channel || !state.isConnected) {
    return await connectToRabbitMQ();
  }
  return true;
};

/**
 * Publish a message to a queue
 */
export const publishToQueue = async (
  queueName: string,
  message: unknown,
  options: { tenantId?: string; [key: string]: any } = {}
): Promise<boolean> => {
  const connected = await ensureConnection();
  if (!connected || !state.channel) {
    console.error("Failed to ensure RabbitMQ connection for publishing to queue");
    return false;
  }

  try {
    // Include tenant ID in headers if available
    const messageOptions = {
      persistent: true,
      headers: {
        "x-tenant-id": options.tenantId,
        ...options,
      },
    };

    return state.channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(message)),
      messageOptions
    );
  } catch (error) {
    console.error(`Error publishing message to queue ${queueName}:`, error);
    return false;
  }
};

/**
 * Publish a message to an exchange
 */
export const publishToExchange = async (
  exchangeName: string,
  routingKey: string,
  message: unknown,
  options: { tenantId?: string; [key: string]: any } = {}
): Promise<boolean> => {
  const connected = await ensureConnection();
  if (!connected || !state.channel) {
    console.error("Failed to ensure RabbitMQ connection for publishing to exchange");
    return false;
  }

  try {
    // Include tenant ID in headers if available
    const messageOptions = {
      persistent: true,
      headers: {
        "x-tenant-id": options.tenantId,
        ...options,
      },
    };

    return state.channel.publish(
      exchangeName,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      messageOptions
    );
  } catch (error) {
    console.error(
      `Error publishing message to exchange ${exchangeName}:`,
      error
    );
    return false;
  }
};

/**
 * Close RabbitMQ connection
 */
export const closeRabbitMQConnection = async (): Promise<void> => {
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
