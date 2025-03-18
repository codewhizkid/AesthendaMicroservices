const User = require('../models/User');
const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server');

const userResolvers = {
  Query: {
    // Get all users (admin only)
    users: async (_, __, { user }) => {
      // Check if user is authenticated and has admin role
      if (!user || user.role !== 'admin') {
        throw new ForbiddenError('Not authorized to access this resource');
      }
      
      try {
        return await User.find();
      } catch (error) {
        throw new Error(error.message);
      }
    },
    
    // Get a specific user by ID (admin only or self)
    user: async (_, { id }, { user }) => {
      // Check if user is authenticated and either has admin role or is requesting their own info
      if (!user || (user.role !== 'admin' && user.id !== id)) {
        throw new ForbiddenError('Not authorized to access this resource');
      }
      
      try {
        const foundUser = await User.findById(id);
        if (!foundUser) {
          throw new Error('User not found');
        }
        return foundUser;
      } catch (error) {
        throw new Error(error.message);
      }
    }
  },
  
  Mutation: {
    // Update current user's profile
    updateProfile: async (_, args, { user }) => {
      // Check if user is authenticated
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      try {
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          throw new Error('User not found');
        }
        
        // Update only the fields that were provided
        if (args.name) currentUser.name = args.name;
        if (args.email) {
          // Check if new email is already in use by another user
          const existingUser = await User.findOne({ email: args.email });
          if (existingUser && existingUser._id.toString() !== user.id) {
            throw new UserInputError('Email already in use');
          }
          currentUser.email = args.email;
        }
        if (args.password) currentUser.password = args.password;
        
        await currentUser.save();
        return currentUser;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    
    // Delete a user (admin only or self)
    deleteUser: async (_, { userId }, { user }) => {
      // Check if user is authenticated and either has admin role or is deleting their own account
      if (!user || (user.role !== 'admin' && user.id !== userId)) {
        throw new ForbiddenError('Not authorized to delete this user');
      }
      
      try {
        const userToDelete = await User.findById(userId);
        if (!userToDelete) {
          throw new Error('User not found');
        }
        
        await User.findByIdAndDelete(userId);
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    }
  }
};

module.exports = userResolvers; 