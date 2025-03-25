const bcrypt = require('bcryptjs');
const { AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server');
const Salon = require('../models/Salon');
const User = require('../models/User');
const PendingSalon = require('../models/PendingSalon');
const Role = require('../models/Role');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key');

// Plans configuration
const plans = {
  free: { price: 0 },
  basic: { price: 2900 }, // $29/month
  premium: { price: 5900 }, // $59/month
  enterprise: { price: 9900 } // $99/month
};

// Helper to validate user's permission to access a salon
const validateSalonAccess = async (tenantId, user) => {
  if (!user) {
    throw new AuthenticationError('You must be logged in to access salon data');
  }
  
  // System admins can access all salons
  if (user.role === 'system_admin') {
    return true;
  }
  
  // Salon admins can only access their own salon
  if (user.role === 'salon_admin' && user.tenantId === tenantId) {
    return true;
  }
  
  // All other roles are not allowed to access salon management
  throw new ForbiddenError('You do not have permission to access this salon data');
};

const salonResolvers = {
  Query: {
    // Get all salons (system admin only)
    salons: async (_, __, { user }) => {
      if (!user || user.role !== 'system_admin') {
        throw new ForbiddenError('Only system administrators can view all salons');
      }
      
      return Salon.find({}).populate('owner');
    },
    
    // Get a specific salon by tenant ID
    salon: async (_, { tenantId }, { user }) => {
      await validateSalonAccess(tenantId, user);
      
      const salon = await Salon.findOne({ tenantId }).populate('owner');
      if (!salon) {
        throw new UserInputError('Salon not found');
      }
      
      return salon;
    },
    
    // Get trial information for a salon
    trialInfo: async (_, { tenantId }, { user }) => {
      await validateSalonAccess(tenantId, user);
      
      const salon = await Salon.findOne({ tenantId });
      if (!salon) {
        throw new UserInputError('Salon not found');
      }
      
      return {
        isInTrial: salon.isInTrial(),
        remainingDays: salon.getRemainingTrialDays()
      };
    },
    
    // Get all users for a specific tenant
    tenantUsers: async (_, { tenantId }, { user }) => {
      await validateSalonAccess(tenantId, user);
      
      return User.find({ tenantId });
    }
  },
  
  Mutation: {
    // Register a new salon (first step of onboarding)
    registerSalon: async (_, { input }) => {
      const { businessName, ownerName, email, password, planId } = input;
      
      // Validate plan ID
      if (!plans[planId]) {
        throw new UserInputError('Invalid plan selected');
      }
      
      // Check if email is already in use
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new UserInputError('Email is already in use');
      }
      
      try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create a payment intent with Stripe
        // In production, you'd include more details and proper error handling
        const paymentIntent = await stripe.paymentIntents.create({
          amount: plans[planId].price * 100, // Convert to cents
          currency: 'usd',
          metadata: { businessName, email, planId }
        });
        
        // Store the pending salon registration
        await PendingSalon.create({
          businessName,
          ownerName,
          email,
          hashedPassword,
          planId,
          paymentIntentId: paymentIntent.id,
          status: 'pending_payment'
        });
        
        // Return the client secret for completing the payment on the frontend
        return paymentIntent.client_secret;
      } catch (error) {
        console.error('Error registering salon:', error);
        throw new Error('Failed to register salon: ' + error.message);
      }
    },
    
    // Confirm salon registration after payment (usually called by webhook)
    confirmSalonRegistration: async (_, { paymentIntentId }) => {
      // Find the pending registration
      const pendingSalon = await PendingSalon.findOne({ paymentIntentId });
      if (!pendingSalon) {
        throw new UserInputError('Invalid payment reference');
      }
      
      try {
        // Create the salon with a new tenant ID
        const salon = new Salon({
          businessName: pendingSalon.businessName,
          plan: pendingSalon.planId,
          status: pendingSalon.planId === 'free' ? 'active' : 'trial'
        });
        
        // Save to get the generated tenant ID
        await salon.save();
        
        // Create the salon admin user
        const adminUser = new User({
          name: pendingSalon.ownerName,
          email: pendingSalon.email,
          password: pendingSalon.hashedPassword, // Already hashed in registerSalon
          tenantId: salon.tenantId,
          role: 'salon_admin',
          isVerified: true
        });
        
        await adminUser.save();
        
        // Update the salon with the owner reference
        salon.owner = adminUser._id;
        await salon.save();
        
        // Create default roles for the tenant
        await Role.createDefaultRoles(salon.tenantId, adminUser._id);
        
        // Remove the pending registration
        await PendingSalon.findByIdAndDelete(pendingSalon._id);
        
        return true;
      } catch (error) {
        console.error('Error confirming salon registration:', error);
        throw new Error('Failed to complete salon registration: ' + error.message);
      }
    },
    
    // Complete an onboarding step for a salon
    completeSalonOnboardingStep: async (_, { input }, { user, tenantId }) => {
      const { tenantId: stepTenantId, step, data } = input;
      
      // Verify the user has permission to update this salon
      if (!user || user.tenantId !== stepTenantId) {
        throw new ForbiddenError('You can only update your own salon');
      }
      
      try {
        const salon = await Salon.findOne({ tenantId: stepTenantId });
        if (!salon) {
          throw new UserInputError('Salon not found');
        }
        
        // Parse the step data (JSON string)
        const stepData = JSON.parse(data);
        
        // Update the salon based on the step
        switch (step) {
          case 1: // Business details
            if (stepData.businessHours) {
              salon.settings.businessHours = stepData.businessHours;
            }
            if (stepData.serviceCategories) {
              salon.settings.serviceCategories = stepData.serviceCategories;
            }
            salon.onboardingStatus.step1Completed = true;
            break;
            
          case 2: // Branding
            if (stepData.branding) {
              salon.settings.branding = stepData.branding;
            }
            salon.onboardingStatus.step2Completed = true;
            break;
            
          case 3: // Staff setup
            // Staff setup is handled separately through user creation
            salon.onboardingStatus.step3Completed = true;
            break;
            
          case 4: // Final review
            salon.onboardingStatus.step4Completed = true;
            salon.onboardingStatus.completed = true;
            break;
            
          default:
            throw new UserInputError('Invalid onboarding step');
        }
        
        await salon.save();
        return true;
      } catch (error) {
        console.error('Error completing onboarding step:', error);
        throw new Error('Failed to complete onboarding step: ' + error.message);
      }
    },
    
    // Update salon settings
    updateSalonSettings: async (_, { tenantId, settings }, { user }) => {
      await validateSalonAccess(tenantId, user);
      
      try {
        const salon = await Salon.findOne({ tenantId });
        if (!salon) {
          throw new UserInputError('Salon not found');
        }
        
        // Update settings
        if (settings.businessHours) {
          salon.settings.businessHours = settings.businessHours;
        }
        
        if (settings.serviceCategories) {
          salon.settings.serviceCategories = settings.serviceCategories;
        }
        
        if (settings.branding) {
          salon.settings.branding = settings.branding;
        }
        
        await salon.save();
        return salon;
      } catch (error) {
        console.error('Error updating salon settings:', error);
        throw new Error('Failed to update salon settings: ' + error.message);
      }
    },
    
    // Create a staff member for a salon
    createStaffMember: async (_, { tenantId, name, email, password, roleIds }, { user }) => {
      await validateSalonAccess(tenantId, user);
      
      // Check if email is already in use
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new UserInputError('Email is already in use');
      }
      
      try {
        // Create the staff user
        const staffUser = new User({
          name,
          email,
          password, // Will be hashed by the User model's pre-save hook
          tenantId,
          role: 'stylist', // Default role
          isVerified: true
        });
        
        await staffUser.save();
        
        // Assign custom roles if provided
        if (roleIds && roleIds.length > 0) {
          // Validate that all roles belong to this tenant
          const roles = await Role.find({
            _id: { $in: roleIds },
            tenantId
          });
          
          if (roles.length !== roleIds.length) {
            throw new UserInputError('One or more invalid role IDs');
          }
          
          // Assign roles
          for (const role of roles) {
            staffUser.customRoles.push({
              name: role.name,
              tenantId,
              permissions: role.permissions
            });
          }
          
          await staffUser.save();
        }
        
        return staffUser;
      } catch (error) {
        console.error('Error creating staff member:', error);
        throw new Error('Failed to create staff member: ' + error.message);
      }
    }
  }
};

module.exports = salonResolvers; 