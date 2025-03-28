const User = require('../models/User');
const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server');

/**
 * Check if a user has access to the requested user data
 * @param {Object} user - Current authenticated user
 * @param {String} requestedUserId - ID of the user being requested
 * @param {String|null} requestedTenantId - Tenant ID of the user being requested
 * @returns {Boolean} - Whether the user has access
 */
const canAccessUserData = (user, requestedUserId, requestedTenantId) => {
  // System admins can access all users
  if (user.role === 'system_admin') {
    return true;
  }
  
  // Users can always access their own data
  if (user.id === requestedUserId) {
    return true;
  }
  
  // Salon admins can access users in their tenant
  if (user.role === 'salon_admin' && user.tenantId === requestedTenantId) {
    return true;
  }
  
  return false;
};

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
    },
    
    /**
     * Get a user by stylist ID
     */
    userByStylistId: async (_, { stylist_id, tenantId }, context) => {
      // Authentication check
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Default to the user's tenant if none provided
      const targetTenantId = tenantId || context.user.tenantId;
      
      // Find the user with the specified stylist_id
      const user = await User.findOne({ 
        stylist_id,
        tenantId: targetTenantId
      });
      
      if (!user) {
        throw new UserInputError('User not found');
      }
      
      // Check access permissions
      if (!canAccessUserData(context.user, user.id, user.tenantId)) {
        throw new ForbiddenError('Not authorized to access this user data');
      }
      
      return user;
    },
    
    /**
     * Get all stylists for a tenant
     */
    stylistsByTenant: async (_, { tenantId }, context) => {
      // Authentication check
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Default to the user's tenant if none provided
      const targetTenantId = tenantId || context.user.tenantId;
      
      // Check if user has access to this tenant's data
      if (context.user.role !== 'system_admin' && context.user.tenantId !== targetTenantId) {
        throw new ForbiddenError('Not authorized to access this tenant data');
      }
      
      // Find all users with stylist-related roles in the tenant
      return User.find({
        tenantId: targetTenantId,
        role: { $in: ['stylist', 'salon_staff', 'salon_admin'] }
      });
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
    },
    
    /**
     * Update a user's stylist profile
     */
    updateStylistProfile: async (_, { id, input }, context) => {
      // Authentication check
      if (!context.user) {
        throw new AuthenticationError('Not authenticated');
      }
      
      // Find the user
      const user = await User.findById(id);
      if (!user) {
        throw new UserInputError('User not found');
      }
      
      // Check if the user has a stylist role
      if (!['stylist', 'salon_staff', 'salon_admin'].includes(user.role)) {
        throw new UserInputError('User is not a stylist');
      }
      
      // Check access permissions
      if (!canAccessUserData(context.user, user.id, user.tenantId)) {
        throw new ForbiddenError('Not authorized to update this stylist profile');
      }
      
      // Update the stylist profile
      const updateData = {
        profile: { ...user.profile, ...input.profile },
        services: input.services || user.services,
        updatedAt: new Date()
      };
      
      // Only salon_admin or system_admin can update role
      if (['salon_admin', 'system_admin'].includes(context.user.role) && input.role) {
        const allowedRoles = ['stylist', 'salon_staff', 'salon_admin'];
        if (!allowedRoles.includes(input.role)) {
          throw new UserInputError(`Role must be one of: ${allowedRoles.join(', ')}`);
        }
        updateData.role = input.role;
      }
      
      // Update the user
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      return updatedUser;
    }
  },
  
  // Type resolvers
  User: {
    // ... existing field resolvers ...
    
    /**
     * Resolve the full name field
     */
    fullName: (user) => {
      return `${user.firstName} ${user.lastName}`;
    }
  }
};

module.exports = userResolvers; 