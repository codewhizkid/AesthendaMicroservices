const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server');
const Role = require('../models/Role');
const User = require('../models/User');

// Helper to validate user's permission to manage roles
const validateRoleAccess = async (tenantId, user) => {
  if (!user) {
    throw new AuthenticationError('You must be logged in to manage roles');
  }
  
  // System admins can manage all roles
  if (user.role === 'system_admin') {
    return true;
  }
  
  // Salon admins can only manage roles in their tenant
  if (user.role === 'salon_admin' && user.tenantId === tenantId) {
    return true;
  }
  
  // All other roles are not allowed to manage roles
  throw new ForbiddenError('You do not have permission to manage roles');
};

const roleResolvers = {
  Query: {
    // Get all roles for a specific tenant
    tenantRoles: async (_, { tenantId }, { user }) => {
      await validateRoleAccess(tenantId, user);
      
      return Role.find({ tenantId }).populate('createdBy');
    },
    
    // Get a specific role by ID
    role: async (_, { id }, { user }) => {
      const role = await Role.findById(id).populate('createdBy');
      
      if (!role) {
        throw new UserInputError('Role not found');
      }
      
      // Validate access to this role's tenant
      await validateRoleAccess(role.tenantId, user);
      
      return role;
    },
    
    // Get all available permissions that can be assigned to roles
    availablePermissions: async () => {
      return Role.getAllPermissions();
    }
  },
  
  Mutation: {
    // Create a new role for a tenant
    createRole: async (_, { input }, { user }) => {
      const { name, description, permissions, tenantId } = input;
      
      // Validate access
      await validateRoleAccess(tenantId, user);
      
      // Check if a role with this name already exists in the tenant
      const existingRole = await Role.findOne({ name, tenantId });
      if (existingRole) {
        throw new UserInputError('A role with this name already exists in your salon');
      }
      
      // Validate permissions
      const allPermissions = Role.getAllPermissions();
      for (const permission of permissions) {
        if (!allPermissions.includes(permission)) {
          throw new UserInputError(`Invalid permission: ${permission}`);
        }
      }
      
      try {
        // Create the role
        const role = new Role({
          name,
          description,
          permissions,
          tenantId,
          isDefault: false,
          isCustom: true,
          createdBy: user.id
        });
        
        await role.save();
        return role;
      } catch (error) {
        console.error('Error creating role:', error);
        throw new Error('Failed to create role: ' + error.message);
      }
    },
    
    // Update an existing role
    updateRole: async (_, { id, input }, { user }) => {
      const { name, description, permissions } = input;
      
      // Find the role
      const role = await Role.findById(id);
      if (!role) {
        throw new UserInputError('Role not found');
      }
      
      // Validate access to this role's tenant
      await validateRoleAccess(role.tenantId, user);
      
      // Don't allow modification of default roles
      if (!role.isCustom) {
        throw new ForbiddenError('Default roles cannot be modified');
      }
      
      // Check for name conflicts
      if (name && name !== role.name) {
        const existingRole = await Role.findOne({ 
          name, 
          tenantId: role.tenantId,
          _id: { $ne: id }
        });
        
        if (existingRole) {
          throw new UserInputError('A role with this name already exists in your salon');
        }
      }
      
      // Validate permissions
      if (permissions) {
        const allPermissions = Role.getAllPermissions();
        for (const permission of permissions) {
          if (!allPermissions.includes(permission)) {
            throw new UserInputError(`Invalid permission: ${permission}`);
          }
        }
      }
      
      try {
        // Update the role
        if (name) role.name = name;
        if (description !== undefined) role.description = description;
        if (permissions) role.permissions = permissions;
        
        await role.save();
        
        // Update any user custom roles
        const users = await User.find({
          tenantId: role.tenantId,
          'customRoles._id': role._id
        });
        
        for (const user of users) {
          const customRoleIndex = user.customRoles.findIndex(r => 
            r._id.toString() === role._id.toString()
          );
          
          if (customRoleIndex !== -1) {
            user.customRoles[customRoleIndex].name = role.name;
            user.customRoles[customRoleIndex].permissions = role.permissions;
            await user.save();
          }
        }
        
        return role;
      } catch (error) {
        console.error('Error updating role:', error);
        throw new Error('Failed to update role: ' + error.message);
      }
    },
    
    // Delete a role
    deleteRole: async (_, { id }, { user }) => {
      // Find the role
      const role = await Role.findById(id);
      if (!role) {
        throw new UserInputError('Role not found');
      }
      
      // Validate access to this role's tenant
      await validateRoleAccess(role.tenantId, user);
      
      // Don't allow deletion of default roles
      if (!role.isCustom) {
        throw new ForbiddenError('Default roles cannot be deleted');
      }
      
      try {
        // First, remove this role from any users
        const users = await User.find({
          tenantId: role.tenantId,
          'customRoles._id': role._id
        });
        
        for (const user of users) {
          user.customRoles = user.customRoles.filter(r => 
            r._id.toString() !== role._id.toString()
          );
          await user.save();
        }
        
        // Delete the role
        await Role.findByIdAndDelete(id);
        
        return true;
      } catch (error) {
        console.error('Error deleting role:', error);
        throw new Error('Failed to delete role: ' + error.message);
      }
    },
    
    // Assign a role to a user
    assignRoleToUser: async (_, { userId, roleId }, { user }) => {
      // Find the user
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError('User not found');
      }
      
      // Find the role
      const role = await Role.findById(roleId);
      if (!role) {
        throw new UserInputError('Role not found');
      }
      
      // Validate access to this role's tenant
      await validateRoleAccess(role.tenantId, user);
      
      // Ensure user belongs to same tenant
      if (targetUser.tenantId !== role.tenantId) {
        throw new ForbiddenError('User and role must belong to the same salon');
      }
      
      try {
        // Check if user already has this role
        const hasRole = targetUser.customRoles.some(r => 
          r._id && r._id.toString() === roleId
        );
        
        if (hasRole) {
          throw new UserInputError('User already has this role');
        }
        
        // Add the role to the user
        targetUser.customRoles.push({
          _id: role._id,
          name: role.name,
          tenantId: role.tenantId,
          permissions: role.permissions
        });
        
        await targetUser.save();
        return targetUser;
      } catch (error) {
        console.error('Error assigning role to user:', error);
        throw new Error('Failed to assign role: ' + error.message);
      }
    },
    
    // Remove a role from a user
    removeRoleFromUser: async (_, { userId, roleId }, { user }) => {
      // Find the user
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError('User not found');
      }
      
      // Validate access to this user's tenant
      await validateRoleAccess(targetUser.tenantId, user);
      
      try {
        // Check if user has this role
        const roleIndex = targetUser.customRoles.findIndex(r => 
          r._id && r._id.toString() === roleId
        );
        
        if (roleIndex === -1) {
          throw new UserInputError('User does not have this role');
        }
        
        // Remove the role
        targetUser.customRoles.splice(roleIndex, 1);
        await targetUser.save();
        
        return targetUser;
      } catch (error) {
        console.error('Error removing role from user:', error);
        throw new Error('Failed to remove role: ' + error.message);
      }
    }
  }
};

module.exports = roleResolvers; 