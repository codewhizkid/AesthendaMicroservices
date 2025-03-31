const Salon = require('../models/Salon');
const User = require('../models/User');
const config = require('../config');

/**
 * Get salon information by tenantId
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.getSalonInfo = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Check if user has access to this tenant
    if (req.user.tenantId !== tenantId && req.user.role !== 'system_admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to tenant data' });
    }
    
    const salon = await Salon.findByTenantId(tenantId);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    res.status(200).json({
      success: true,
      data: salon
    });
  } catch (error) {
    console.error('Error fetching salon info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching salon information',
      error: config.server.isDev ? error.message : undefined
    });
  }
};

/**
 * Update basic salon information
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.updateSalonInfo = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updateData = req.body;
    
    // Check if user has access to this tenant
    if (req.user.tenantId !== tenantId && req.user.role !== 'system_admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to tenant data' });
    }
    
    // Find the salon
    const salon = await Salon.findByTenantId(tenantId);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Validate update data - only allow specific fields to be updated
    const allowedFields = ['businessName', 'contactInfo', 'address'];
    
    // Filter out fields that shouldn't be updated
    const filteredUpdateData = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    }
    
    // Update the salon with filtered data
    const updatedSalon = await Salon.findByIdAndUpdate(
      salon._id,
      { $set: filteredUpdateData },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Salon information updated successfully',
      data: updatedSalon
    });
  } catch (error) {
    console.error('Error updating salon info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating salon information',
      error: config.server.isDev ? error.message : undefined
    });
  }
};

/**
 * Update salon branding settings
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.updateBranding = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const brandingData = req.body;
    
    // Check if user has access to this tenant
    if (req.user.tenantId !== tenantId && req.user.role !== 'system_admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to tenant data' });
    }
    
    // Find the salon
    const salon = await Salon.findByTenantId(tenantId);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Update branding settings
    const updatedSalon = await Salon.findByIdAndUpdate(
      salon._id,
      { $set: { 'settings.branding': brandingData } },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Salon branding updated successfully',
      data: updatedSalon.settings.branding
    });
  } catch (error) {
    console.error('Error updating salon branding:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating salon branding',
      error: config.server.isDev ? error.message : undefined
    });
  }
};

/**
 * Update business hours
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.updateBusinessHours = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const businessHoursData = req.body;
    
    // Check if user has access to this tenant
    if (req.user.tenantId !== tenantId && req.user.role !== 'system_admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to tenant data' });
    }
    
    // Find the salon
    const salon = await Salon.findByTenantId(tenantId);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Validate business hours format
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const validHours = weekdays.every(day => {
      if (!businessHoursData[day]) return true; // Skip if day not provided
      
      const { open, close, isOpen } = businessHoursData[day];
      
      // If closed, no need to validate times
      if (isOpen === false) return true;
      
      // Validate time format (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      return timeRegex.test(open) && timeRegex.test(close);
    });
    
    if (!validHours) {
      return res.status(400).json({
        success: false,
        message: 'Invalid business hours format. Use HH:MM format for time values.'
      });
    }
    
    // Update business hours
    const updatedSalon = await Salon.findByIdAndUpdate(
      salon._id,
      { $set: { 'settings.businessHours': businessHoursData } },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Business hours updated successfully',
      data: updatedSalon.settings.businessHours
    });
  } catch (error) {
    console.error('Error updating business hours:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating business hours',
      error: config.server.isDev ? error.message : undefined
    });
  }
};

/**
 * Update booking page configuration
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.updateBookingPageConfig = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const bookingConfig = req.body;
    
    // Check if user has access to this tenant
    if (req.user.tenantId !== tenantId && req.user.role !== 'system_admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to tenant data' });
    }
    
    // Find the salon
    const salon = await Salon.findByTenantId(tenantId);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Check if slug is being updated and if it's unique
    if (bookingConfig.slug && bookingConfig.slug !== salon.bookingPageConfig?.slug) {
      const slugExists = await Salon.findOne({ 'bookingPageConfig.slug': bookingConfig.slug });
      
      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: 'This URL slug is already taken. Please choose another.'
        });
      }
    }
    
    // Update booking page configuration
    const updatedSalon = await Salon.findByIdAndUpdate(
      salon._id,
      { $set: { bookingPageConfig: bookingConfig } },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Booking page configuration updated successfully',
      data: updatedSalon.bookingPageConfig
    });
  } catch (error) {
    console.error('Error updating booking page config:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating booking page configuration',
      error: config.server.isDev ? error.message : undefined
    });
  }
};

/**
 * Get salon by booking page slug
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.getSalonBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const salon = await Salon.findBySlug(slug);
    
    if (!salon) {
      return res.status(404).json({ success: false, message: 'Salon not found' });
    }
    
    // Return only public information
    const publicSalonData = {
      businessName: salon.businessName,
      contactInfo: {
        email: salon.contactInfo.email,
        phone: salon.contactInfo.phone,
        website: salon.contactInfo.website,
        socialMedia: salon.contactInfo.socialMedia
      },
      address: salon.address,
      businessHours: salon.settings.businessHours,
      branding: salon.settings.branding,
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
    
    res.status(200).json({
      success: true,
      data: publicSalonData
    });
  } catch (error) {
    console.error('Error fetching salon by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching salon information',
      error: config.server.isDev ? error.message : undefined
    });
  }
};