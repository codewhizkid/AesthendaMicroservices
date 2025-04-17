import mongoose from "mongoose";
import config from "../config";

/**
 * Connect to MongoDB
 */
export const connectToDatabase = async (): Promise<void> => {
  try {
    // Set global mongoose options
    mongoose.set("strictQuery", true);

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri);

    console.log(`Connected to MongoDB: ${config.mongoUri}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    // Graceful shutdown handling
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

/**
 * Get the Mongoose connection
 */
export const getConnection = (): mongoose.Connection => {
  return mongoose.connection;
};

/**
 * Close the MongoDB connection
 */
export const closeConnection = async (): Promise<void> => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
};
