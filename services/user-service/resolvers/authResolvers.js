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