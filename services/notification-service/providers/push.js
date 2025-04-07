const admin = require('firebase-admin');

class PushProvider {
  constructor() {
    this.messaging = null;
  }

  async initialize() {
    try {
      // Initialize Firebase Admin SDK
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          })
        });
      }

      this.messaging = admin.messaging();
      console.log('Push notification provider initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notification provider:', error);
      throw error;
    }
  }

  async send({ userId, title, body, data = {} }) {
    if (!this.messaging) {
      throw new Error('Push notification provider not initialized');
    }

    try {
      // Get user's FCM tokens from your database
      const userTokens = await this.getUserTokens(userId);
      
      if (!userTokens.length) {
        console.warn(`No FCM tokens found for user ${userId}`);
        return;
      }

      const message = {
        notification: {
          title,
          body
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK' // For Flutter apps
        }
      };

      // Send to multiple tokens
      const response = await this.messaging.sendMulticast({
        tokens: userTokens,
        ...message
      });

      console.log('Push notification sent successfully:', response.successCount, 'devices reached');
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(userTokens[idx]);
          }
        });
        
        // Remove invalid tokens from your database
        if (failedTokens.length > 0) {
          await this.removeInvalidTokens(userId, failedTokens);
        }
      }

      return response;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  async getUserTokens(userId) {
    // TODO: Implement fetching user's FCM tokens from your database
    // This is a placeholder implementation
    return [];
  }

  async removeInvalidTokens(userId, tokens) {
    // TODO: Implement removing invalid tokens from your database
    console.log('Removing invalid tokens for user:', userId, tokens);
  }

  async shutdown() {
    try {
      await admin.app().delete();
      this.messaging = null;
      console.log('Push notification provider shut down');
    } catch (error) {
      console.error('Error shutting down push notification provider:', error);
    }
  }
}

module.exports = { PushProvider }; 