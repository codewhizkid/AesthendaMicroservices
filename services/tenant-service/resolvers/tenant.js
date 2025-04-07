const { AuthenticationError, ForbiddenError } = require('apollo-server-express');
const Tenant = require('../../shared/models/Tenant');
const { validateBusinessHours } = require('../validation/businessHours');
const { validateAppointmentSettings } = require('../validation/appointmentSettings');
const { validateNotificationSettings } = require('../validation/notificationSettings');
const { validateBranding } = require('../validation/branding');
const { validateServiceSettings } = require('../validation/serviceSettings');

// Permission check helper
const checkPermission = (user, permission) => {
  if (!user || !user.hasPermission(permission)) {
    throw new ForbiddenError('You do not have permission to perform this action');
  }
};

const resolvers = {
  Query: {
    tenant: async (_, { id }, context) => {
      checkPermission(context.user, 'view_tenant_settings');
      
      const tenant = await Tenant.findById(id);
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      return tenant;
    },

    tenantBySlug: async (_, { slug }, context) => {
      checkPermission(context.user, 'view_tenant_settings');
      
      const tenant = await Tenant.findOne({ slug });
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      return tenant;
    },

    validateAppointmentTime: async (_, { tenantId, date, duration }, context) => {
      checkPermission(context.user, 'view_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      return tenant.validateAppointmentTime(date, duration);
    },

    getActiveSpecialOffers: async (_, { tenantId }, context) => {
      checkPermission(context.user, 'view_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      return tenant.getActiveSpecialOffers();
    },

    getBusinessHours: async (_, { tenantId, dayOfWeek }, context) => {
      checkPermission(context.user, 'view_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      return tenant.getBusinessHours(dayOfWeek);
    }
  },

  Mutation: {
    updateBusinessHours: async (_, { tenantId, businessHours }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate business hours
      const validationErrors = validateBusinessHours(businessHours);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid business hours: ${validationErrors.join(', ')}`);
      }

      tenant.settings.businessHours = businessHours;
      await tenant.save();
      return tenant;
    },

    updateHolidays: async (_, { tenantId, holidays }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.settings.holidays = holidays;
      await tenant.save();
      return tenant;
    },

    addSpecialEvent: async (_, { tenantId, event }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.settings.specialEvents.push(event);
      await tenant.save();
      return tenant;
    },

    removeSpecialEvent: async (_, { tenantId, eventId }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.settings.specialEvents = tenant.settings.specialEvents.filter(
        event => event._id.toString() !== eventId
      );
      await tenant.save();
      return tenant;
    },

    updateAppointmentSettings: async (_, { tenantId, settings }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate appointment settings
      const validationErrors = validateAppointmentSettings(settings);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid appointment settings: ${validationErrors.join(', ')}`);
      }

      tenant.settings.appointmentSettings = {
        ...tenant.settings.appointmentSettings,
        ...settings
      };
      await tenant.save();
      return tenant;
    },

    updateStaffSettings: async (_, { tenantId, settings }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.settings.staffSettings = {
        ...tenant.settings.staffSettings,
        ...settings
      };
      await tenant.save();
      return tenant;
    },

    updateNotificationSettings: async (_, { tenantId, settings }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate notification settings
      const validationErrors = validateNotificationSettings(settings);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid notification settings: ${validationErrors.join(', ')}`);
      }

      tenant.settings.notificationSettings = {
        ...tenant.settings.notificationSettings,
        ...settings
      };
      await tenant.save();
      return tenant;
    },

    updateBranding: async (_, { tenantId, logo, colors, typography, layout, socialLinks }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate branding settings
      const validationErrors = validateBranding({ logo, colors, typography, layout });
      if (validationErrors.length > 0) {
        throw new Error(`Invalid branding settings: ${validationErrors.join(', ')}`);
      }

      if (logo) tenant.branding.logo = logo;
      if (colors) tenant.branding.colors = colors;
      if (typography) tenant.branding.typography = typography;
      if (layout) tenant.branding.layout = layout;
      if (socialLinks) tenant.branding.socialLinks = socialLinks;

      await tenant.save();
      return tenant;
    },

    updateCustomCss: async (_, { tenantId, css }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.branding.customCss = css;
      await tenant.save();
      return tenant;
    },

    addServiceCategory: async (_, { tenantId, category }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate service category
      const validationErrors = validateServiceSettings.category(category);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid service category: ${validationErrors.join(', ')}`);
      }

      tenant.services.categories.push(category);
      await tenant.save();
      return tenant;
    },

    updateServiceCategory: async (_, { tenantId, categoryId, category }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate service category
      const validationErrors = validateServiceSettings.category(category);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid service category: ${validationErrors.join(', ')}`);
      }

      const categoryIndex = tenant.services.categories.findIndex(
        cat => cat._id.toString() === categoryId
      );
      if (categoryIndex === -1) {
        throw new Error('Service category not found');
      }

      tenant.services.categories[categoryIndex] = {
        ...tenant.services.categories[categoryIndex],
        ...category
      };
      await tenant.save();
      return tenant;
    },

    removeServiceCategory: async (_, { tenantId, categoryId }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.services.categories = tenant.services.categories.filter(
        category => category._id.toString() !== categoryId
      );
      await tenant.save();
      return tenant;
    },

    addPricingTier: async (_, { tenantId, tier }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate pricing tier
      const validationErrors = validateServiceSettings.pricingTier(tier);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid pricing tier: ${validationErrors.join(', ')}`);
      }

      tenant.services.pricingTiers.push(tier);
      await tenant.save();
      return tenant;
    },

    updatePricingTier: async (_, { tenantId, tierId, tier }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate pricing tier
      const validationErrors = validateServiceSettings.pricingTier(tier);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid pricing tier: ${validationErrors.join(', ')}`);
      }

      const tierIndex = tenant.services.pricingTiers.findIndex(
        t => t._id.toString() === tierId
      );
      if (tierIndex === -1) {
        throw new Error('Pricing tier not found');
      }

      tenant.services.pricingTiers[tierIndex] = {
        ...tenant.services.pricingTiers[tierIndex],
        ...tier
      };
      await tenant.save();
      return tenant;
    },

    removePricingTier: async (_, { tenantId, tierId }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.services.pricingTiers = tenant.services.pricingTiers.filter(
        tier => tier._id.toString() !== tierId
      );
      await tenant.save();
      return tenant;
    },

    addSpecialOffer: async (_, { tenantId, offer }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate special offer
      const validationErrors = validateServiceSettings.specialOffer(offer);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid special offer: ${validationErrors.join(', ')}`);
      }

      tenant.services.specialOffers.push({
        ...offer,
        currentUses: 0
      });
      await tenant.save();
      return tenant;
    },

    updateSpecialOffer: async (_, { tenantId, offerId, offer }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Validate special offer
      const validationErrors = validateServiceSettings.specialOffer(offer);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid special offer: ${validationErrors.join(', ')}`);
      }

      const offerIndex = tenant.services.specialOffers.findIndex(
        o => o._id.toString() === offerId
      );
      if (offerIndex === -1) {
        throw new Error('Special offer not found');
      }

      tenant.services.specialOffers[offerIndex] = {
        ...tenant.services.specialOffers[offerIndex],
        ...offer
      };
      await tenant.save();
      return tenant;
    },

    removeSpecialOffer: async (_, { tenantId, offerId }, context) => {
      checkPermission(context.user, 'manage_tenant_settings');
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      tenant.services.specialOffers = tenant.services.specialOffers.filter(
        offer => offer._id.toString() !== offerId
      );
      await tenant.save();
      return tenant;
    }
  }
};

module.exports = resolvers; 