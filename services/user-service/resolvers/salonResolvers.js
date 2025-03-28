const mongoose = require('mongoose');
const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server');

const Salon = mongoose.model('Salon');
const User = mongoose.model('User');

// Helper to check permissions
const checkSalonAccess = async (context, tenantId) => {
  if (!context.user) {
    throw new AuthenticationError('You must be logged in to perform this action');
  }
  
  // System admins can access any salon
  if (context.user.role === 'system_admin') {
    return true;
  }
  
  // Users can only access their own salon
  if (context.user.tenantId !== tenantId) {
    throw new ForbiddenError('You do not have permission to access this salon');
  }
  
  // Check if the user has the right role to modify salon settings
  const allowedRoles = ['salon_admin', 'salon_manager'];
  if (!allowedRoles.includes(context.user.role)) {
    throw new ForbiddenError('You do not have permission to modify salon settings');
  }
  
  return true;
};

// Salon resolvers
const salonResolvers = {
  Query: {
    getSalon: async (_, { tenantId }, context) => {
      try {
        // For staff members, they can view but not edit
        if (!context.user) {
          throw new AuthenticationError('You must be logged in to view salon information');
        }
        
        // Check if user has access to this tenant (staff can view)
        if (context.user.tenantId !== tenantId && context.user.role !== 'system_admin') {
          throw new ForbiddenError('You do not have permission to access this salon');
        }
        
        const salon = await Salon.findByTenantId(tenantId);
        if (!salon) {
          throw new Error('Salon not found');
        }
        
        return salon;
      } catch (error) {
        console.error('Error fetching salon:', error);
        throw error;
      }
    },
    
    getPublicSalon: async (_, { slug }) => {
      try {
        const salon = await Salon.findBySlug(slug);
        if (!salon) {
          throw new Error('Salon not found');
        }
        
        // Return only public information
        return {
          businessName: salon.businessName,
          contactInfo: salon.contactInfo,
          address: salon.address,
          settings: {
            businessHours: salon.settings.businessHours,
            branding: salon.settings.branding
          },
          bookingPageConfig: {
            pageTitle: salon.bookingPageConfig.pageTitle,
            welcomeMessage: salon.bookingPageConfig.welcomeMessage,
            displayOptions: {
              showPrices: salon.bookingPageConfig.displayOptions.showPrices,
              showDuration: salon.bookingPageConfig.displayOptions.showDuration,
              enableClientLogin: salon.bookingPageConfig.displayOptions.enableClientLogin
            },
            seoSettings: salon.bookingPageConfig.seoSettings
          }
        };
      } catch (error) {
        console.error('Error fetching public salon:', error);
        throw error;
      }
    }
  },
  
  Mutation: {
    updateSalonInfo: async (_, { tenantId, input }, context) => {
      try {
        // Check permissions
        await checkSalonAccess(context, tenantId);
        
        // Find the salon
        const salon = await Salon.findByTenantId(tenantId);
        if (!salon) {
          throw new Error('Salon not found');
        }
        
        // Update salon
        const updatedSalon = await Salon.findByIdAndUpdate(
          salon._id,
          { $set: input },
          { new: true, runValidators: true }
        );
        
        return updatedSalon;
      } catch (error) {
        console.error('Error updating salon info:', error);
        throw error;
      }
    },
    
    updateSalonBranding: async (_, { tenantId, branding }, context) => {
      try {
        // Check permissions
        await checkSalonAccess(context, tenantId);
        
        // Find the salon
        const salon = await Salon.findByTenantId(tenantId);
        if (!salon) {
          throw new Error('Salon not found');
        }
        
        // Update branding
        const updatedSalon = await Salon.findByIdAndUpdate(
          salon._id,
          { $set: { 'settings.branding': branding } },
          { new: true, runValidators: true }
        );
        
        return updatedSalon;
      } catch (error) {
        console.error('Error updating salon branding:', error);
        throw error;
      }
    },
    
    updateBusinessHours: async (_, { tenantId, businessHours }, context) => {
      try {
        // Check permissions
        await checkSalonAccess(context, tenantId);
        
        // Find the salon
        const salon = await Salon.findByTenantId(tenantId);
        if (!salon) {
          throw new Error('Salon not found');
        }
        
        // Validate business hours format
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        weekdays.forEach(day => {
          if (!businessHours[day]) return;
          
          const { open, close, isOpen } = businessHours[day];
          
          // If closed, no need to validate times
          if (isOpen === false) return;
          
          // Validate time format (HH:MM)
          const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
          if (!timeRegex.test(open) || !timeRegex.test(close)) {
            throw new UserInputError(`Invalid time format for ${day}. Use HH:MM format.`);
          }
        });
        
        // Update business hours
        const updatedSalon = await Salon.findByIdAndUpdate(
          salon._id,
          { $set: { 'settings.businessHours': businessHours } },
          { new: true, runValidators: true }
        );
        
        return updatedSalon;
      } catch (error) {
        console.error('Error updating business hours:', error);
        throw error;
      }
    },
    
    updateBookingPageConfig: async (_, { tenantId, bookingConfig }, context) => {
      try {
        // Check permissions
        await checkSalonAccess(context, tenantId);
        
        // Find the salon
        const salon = await Salon.findByTenantId(tenantId);
        if (!salon) {
          throw new Error('Salon not found');
        }
        
        // Check if slug is being updated and if it's unique
        if (bookingConfig.slug && bookingConfig.slug !== salon.bookingPageConfig?.slug) {
          const slugExists = await Salon.findOne({ 'bookingPageConfig.slug': bookingConfig.slug });
          
          if (slugExists) {
            throw new UserInputError('This URL slug is already taken. Please choose another.');
          }
        }
        
        // Update booking page configuration
        const updatedSalon = await Salon.findByIdAndUpdate(
          salon._id,
          { $set: { 'bookingPageConfig': bookingConfig } },
          { new: true, runValidators: true }
        );
        
        return updatedSalon;
      } catch (error) {
        console.error('Error updating booking page config:', error);
        throw error;
      }
    }
  },
  
  // Field resolvers
  Salon: {
    owner: async (salon) => {
      try {
        const owner = await User.findById(salon.owner);
        return owner;
      } catch (error) {
        console.error('Error fetching salon owner:', error);
        throw error;
      }
    }
  }
};

module.exports = salonResolvers;