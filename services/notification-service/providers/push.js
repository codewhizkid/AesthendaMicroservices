let admin;
try {
  admin = require('firebase-admin');
} catch (error) {
  console.warn('Firebase Admin SDK not available, using mock implementation for push notifications');
  admin = null;
}

const path = require('path');
const fs = require('fs');

class PushProvider {
  constructor() {
    this.messaging = null;
    this.isMock = !admin;
  }

  async initialize() {
    try {
      if (this.isMock) {
        console.log('Using mock push notification provider');
        return;
      }
      
      // Initialize Firebase Admin SDK
      if (!admin.apps.length) {
        // First, try using service account file
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
        if (serviceAccountPath) {
          try {
            // Resolve absolute path
            const absolutePath = path.resolve(serviceAccountPath);
            console.log(`Attempting to load Firebase service account from: ${absolutePath}`);
            
            // Read file directly instead of requiring it
            const serviceAccountContent = fs.readFileSync(absolutePath, 'utf8');
            const serviceAccount = JSON.parse(serviceAccountContent);
            
            // Validate service account has required fields
            if (!serviceAccount.project_id) {
              throw new Error('Service account is missing project_id field');
            }
            
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              databaseURL: process.env.FIREBASE_DATABASE_URL
            });
            console.log('Firebase initialized with service account file');
          } catch (fileError) {
            console.warn('Could not load Firebase service account file:', fileError.message);
            
            // Fall back to environment variables
            if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
              admin.initializeApp({
                credential: admin.credential.cert({
                  projectId: process.env.FIREBASE_PROJECT_ID,
                  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
                }),
                databaseURL: process.env.FIREBASE_DATABASE_URL
              });
              console.log('Firebase initialized with environment variables');
            } else {
              console.log('No valid Firebase credentials available, using mock implementation');
              this.isMock = true;
              return;
            }
          }
        } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
          // Use environment variables
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL
          });
          console.log('Firebase initialized with environment variables');
        } else {
          console.log('No Firebase credentials available, using mock implementation');
          this.isMock = true;
          return;
        }
      }

      this.messaging = admin.messaging();
      console.log('Push notification provider initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notification provider:', error);
      console.log('Falling back to mock implementation');
      this.isMock = true;
    }
  }

  async send({ userId, title, body, data = {} }) {
    if (this.isMock) {
      console.log('MOCK: Push notification would be sent:', { userId, title, body, data });
      return { successCount: 1, failureCount: 0 };
    }
    
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
    if (process.env.MOCK_USER_TOKENS) {
      return process.env.MOCK_USER_TOKENS.split(',');
    }
    return [];
  }

  async removeInvalidTokens(userId, tokens) {
    // TODO: Implement removing invalid tokens from your database
    console.log('Removing invalid tokens for user:', userId, tokens);
  }

  async shutdown() {
    if (this.isMock) {
      console.log('MOCK: Push notification provider shut down');
      return;
    }
    
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