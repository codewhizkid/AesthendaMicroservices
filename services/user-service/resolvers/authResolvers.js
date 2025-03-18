const User = require('../models/User');
const { AuthenticationError, UserInputError } = require('apollo-server');
const jwt = require('jsonwebtoken');

const authResolvers = {
  Query: {
    // Get current authenticated user
    me: async (_, __, { user }) => {
      // The user context is set in the context function in index.js
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      try {
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          throw new Error('User not found');
        }
        return currentUser;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    
    // Get users by role (admin only function)
    usersByRole: async (_, { role }, { user }) => {
      // Check if user is authenticated and has admin role
      if (!user || user.role !== 'admin') {
        throw new AuthenticationError('Not authorized to access this resource');
      }
      
      try {
        return await User.find({ role });
      } catch (error) {
        throw new Error(error.message);
      }
    }
  },
  
  Mutation: {
    // Register a new user
    register: async (_, { input }) => {
      const { name, email, password, role } = input;
      
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          throw new UserInputError('Email already in use');
        }
        
        // Create new user
        const user = new User({
          name,
          email,
          password,
          role: role || 'client' // Default to client if not specified
        });
        
        // Save user to database
        await user.save();
        
        // Generate JWT token
        const token = user.generateAuthToken();
        
        // Generate refresh token
        const refreshToken = await user.generateRefreshToken();
        
        return {
          token,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },
    
    // Login user
    login: async (_, { email, password }) => {
      try {
        // Find user by email and include password field
        const user = await User.findOne({ email }).select('+password');
        
        // Check if user exists
        if (!user) {
          throw new UserInputError('Invalid credentials');
        }
        
        // Check if password is correct
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          throw new UserInputError('Invalid credentials');
        }
        
        // Generate JWT token
        const token = user.generateAuthToken();
        
        // Generate refresh token
        const refreshToken = await user.generateRefreshToken();
        
        return {
          token,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        };
      } catch (error) {
        throw new Error(error.message);
      }
    },

    // OAuth login
    oauthLogin: async (_, { input }) => {
      const { provider, token, profile } = input;
      
      try {
        // Parse the profile data from string to JSON
        const profileData = JSON.parse(profile);
        
        // Find or create user from OAuth data
        const { user, created } = await User.findOrCreateFromOAuth(provider, profileData, token);
        
        // Generate JWT token
        const jwtToken = user.generateAuthToken();
        
        // Generate refresh token
        const refreshToken = await user.generateRefreshToken();
        
        return {
          token: jwtToken,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        };
      } catch (error) {
        console.error('OAuth login error:', error);
        throw new Error(`Failed to authenticate with ${provider}: ${error.message}`);
      }
    },

    // Connect OAuth provider to existing account
    connectOAuthProvider: async (_, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      const { provider, token, profile } = input;
      
      try {
        // Parse the profile data
        const profileData = JSON.parse(profile);
        
        // Check if another user already has this OAuth account
        const existingUser = await User.findOne({
          [`oauthProviders.${provider}.id`]: profileData.id
        });
        
        if (existingUser && existingUser._id.toString() !== user.id) {
          throw new UserInputError('This OAuth account is already connected to another user');
        }
        
        // Find current user
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          throw new Error('User not found');
        }
        
        // Initialize oauthProviders if not exists
        if (!currentUser.oauthProviders) {
          currentUser.oauthProviders = {};
        }
        
        // Add or update OAuth provider
        currentUser.oauthProviders[provider] = {
          id: profileData.id,
          token,
          profile: profileData
        };
        
        await currentUser.save();
        return currentUser;
      } catch (error) {
        console.error('Connect OAuth error:', error);
        throw new Error(`Failed to connect ${provider} account: ${error.message}`);
      }
    },

    // Disconnect OAuth provider
    disconnectOAuthProvider: async (_, { provider }, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      try {
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          throw new Error('User not found');
        }
        
        // Check if user has a password or other OAuth providers
        const hasPassword = Boolean(await User.findById(user.id).select('+password').then(u => u.password));
        const otherProviders = currentUser.oauthProviders ? 
          Object.keys(currentUser.oauthProviders).filter(p => p !== provider && currentUser.oauthProviders[p]) : 
          [];
        
        // Prevent removing the last authentication method
        if (!hasPassword && otherProviders.length === 0) {
          throw new UserInputError(
            'Cannot disconnect the only authentication method. Please add a password or connect another provider first.'
          );
        }
        
        // Remove provider
        if (currentUser.oauthProviders && currentUser.oauthProviders[provider]) {
          delete currentUser.oauthProviders[provider];
          await currentUser.save();
        }
        
        return currentUser;
      } catch (error) {
        console.error('Disconnect OAuth error:', error);
        throw new Error(`Failed to disconnect ${provider} account: ${error.message}`);
      }
    },

    // Refresh access token
    refreshToken: async (_, { refreshToken }) => {
      try {
        // Verify refresh token signature
        const decoded = jwt.verify(
          refreshToken, 
          process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret_key'
        );
        
        // Find user by ID from token
        const user = await User.findById(decoded.id);
        if (!user) {
          throw new AuthenticationError('Invalid refresh token');
        }
        
        // Verify the refresh token exists in the user's tokens
        const isValidToken = user.verifyRefreshToken(refreshToken);
        if (!isValidToken) {
          throw new AuthenticationError('Invalid or expired refresh token');
        }
        
        // Generate a new access token
        const newToken = user.generateAuthToken();
        
        return {
          token: newToken,
          success: true
        };
      } catch (error) {
        console.error('Refresh token error:', error);
        throw new AuthenticationError('Invalid refresh token');
      }
    },
    
    // Logout user (invalidate refresh token)
    logout: async (_, { refreshToken }, { user }) => {
      try {
        // If no user is authenticated (invalid/expired JWT), verify refresh token
        let userId;
        
        if (user) {
          userId = user.id;
        } else {
          // Attempt to decode the refresh token
          try {
            const decoded = jwt.verify(
              refreshToken, 
              process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret_key'
            );
            userId = decoded.id;
          } catch (error) {
            console.error('Error decoding refresh token:', error);
            return false;
          }
        }
        
        // Find user and remove the refresh token
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
          return false;
        }
        
        await userToUpdate.removeRefreshToken(refreshToken);
        return true;
      } catch (error) {
        console.error('Logout error:', error);
        return false;
      }
    },
    
    // Logout from all devices (invalidate all refresh tokens)
    logoutAll: async (_, __, { user }) => {
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      try {
        const userToUpdate = await User.findById(user.id);
        if (!userToUpdate) {
          return false;
        }
        
        await userToUpdate.removeAllRefreshTokens();
        return true;
      } catch (error) {
        console.error('Logout all error:', error);
        return false;
      }
    },
    
    // Update user role (admin only)
    updateUserRole: async (_, { userId, role }, { user }) => {
      // Check if user is authenticated and has admin role
      if (!user || user.role !== 'admin') {
        throw new AuthenticationError('Not authorized to change user roles');
      }
      
      try {
        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) {
          throw new Error('User not found');
        }
        
        userToUpdate.role = role;
        await userToUpdate.save();
        
        return userToUpdate;
      } catch (error) {
        throw new Error(error.message);
      }
    }
  }
};

module.exports = authResolvers; 