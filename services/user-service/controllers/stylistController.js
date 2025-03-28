const User = require('../models/User');
const { generateRandomToken } = require('../utils/tokenHelper');
const sendEmail = require('../utils/emailService');
const config = require('../config');
const mongoose = require('mongoose');

/**
 * Create a new stylist account
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const createStylist = async (req, res) => {
  try {
    // Only salon owners or admins can create stylists
    if (!req.user || !['salon_admin', 'system_admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only salon owners or administrators can create stylists'
      });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      role = 'stylist', // Default role is stylist
      phoneNumber,
      title,
      bio,
      services = []
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, and email are required'
      });
    }

    // Determine the tenantId (salon ID)
    const tenantId = req.user.role === 'system_admin' 
      ? req.body.tenantId  // System admin can specify tenantId
      : req.user.tenantId; // Salon admin uses their own tenantId

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Allow only valid stylist/staff roles
    const allowedRoles = ['stylist', 'salon_staff', 'salon_admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role must be one of: ${allowedRoles.join(', ')}`
      });
    }

    // Generate temporary password
    const temporaryPassword = generateRandomToken(12);
    
    // Generate unique stylist ID
    const stylist_id = await User.generateStylistId(tenantId);

    // Create stylist user
    const stylist = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: temporaryPassword, // Will be hashed by the User model
      role,
      tenantId,
      stylist_id,
      profile: {
        phoneNumber,
        title,
        bio
      },
      services,
      isActive: true,
      passwordReset: {
        required: true,
        token: generateRandomToken(),
        expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    await stylist.save();

    // Send invitation email with temporary password
    const resetLink = `${config.frontendUrl}/reset-password?token=${stylist.passwordReset.token}`;
    
    await sendEmail({
      to: email,
      subject: 'Welcome to the team!',
      html: `
        <h1>Welcome to the team!</h1>
        <p>You've been invited to join the salon team.</p>
        <p>Your temporary password is: <strong>${temporaryPassword}</strong></p>
        <p>Please click the link below to set up your password:</p>
        <a href="${resetLink}">Set up your password</a>
        <p>This link will expire in 7 days.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: 'Stylist created successfully',
      stylist: {
        id: stylist._id,
        stylist_id: stylist.stylist_id,
        firstName: stylist.firstName,
        lastName: stylist.lastName,
        email: stylist.email,
        role: stylist.role,
        tenantId: stylist.tenantId
      }
    });
  } catch (error) {
    console.error('Error creating stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stylist',
      error: error.message
    });
  }
};

/**
 * Get all stylists for a salon
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getAllStylists = async (req, res) => {
  try {
    // Only authenticated users with the correct tenant can view stylists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Determine the tenantId to use for the query
    let tenantId;
    
    // System admin can query any tenant
    if (req.user.role === 'system_admin' && req.query.tenantId) {
      tenantId = req.query.tenantId;
    } else {
      // All other roles can only query their own tenant
      tenantId = req.user.tenantId;
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Find all users with the specified tenant ID and stylist roles
    const stylists = await User.find({
      tenantId,
      role: { $in: ['stylist', 'salon_staff', 'salon_admin'] }
    }).select('_id stylist_id firstName lastName email role profile services isActive');

    res.status(200).json({
      success: true,
      count: stylists.length,
      stylists
    });
  } catch (error) {
    console.error('Error fetching stylists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stylists',
      error: error.message
    });
  }
};

/**
 * Get a single stylist by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getStylistById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stylist ID format'
      });
    }

    // Find the stylist
    const stylist = await User.findById(id).select('-password -refreshTokens');

    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Check if user has access to this stylist's information
    if (req.user.role !== 'system_admin' && 
        (req.user.tenantId !== stylist.tenantId || 
         (req.user.role === 'stylist' && req.user.id !== stylist.id))) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this stylist'
      });
    }

    res.status(200).json({
      success: true,
      stylist
    });
  } catch (error) {
    console.error('Error fetching stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stylist',
      error: error.message
    });
  }
};

/**
 * Get stylist by stylist_id
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const getStylistByStylistId = async (req, res) => {
  try {
    const { stylist_id } = req.params;
    const { tenantId } = req.query;

    if (!stylist_id) {
      return res.status(400).json({
        success: false,
        message: 'Stylist ID is required'
      });
    }

    // Determine the tenantId to query
    let queryTenantId;
    
    if (req.user.role === 'system_admin' && tenantId) {
      queryTenantId = tenantId;
    } else {
      queryTenantId = req.user.tenantId;
    }

    if (!queryTenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Find the stylist by stylist_id and tenantId
    const stylist = await User.findOne({
      stylist_id,
      tenantId: queryTenantId
    }).select('-password -refreshTokens');

    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Check if user has access to this stylist's information
    if (req.user.role !== 'system_admin' && 
        (req.user.tenantId !== stylist.tenantId || 
         (req.user.role === 'stylist' && req.user.stylist_id !== stylist.stylist_id))) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this stylist'
      });
    }

    res.status(200).json({
      success: true,
      stylist
    });
  } catch (error) {
    console.error('Error fetching stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stylist',
      error: error.message
    });
  }
};

/**
 * Update stylist information
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const updateStylist = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stylist ID format'
      });
    }

    // Find the stylist
    const stylist = await User.findById(id);

    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Check if user has access to update this stylist
    if (req.user.role !== 'system_admin' && 
        (req.user.tenantId !== stylist.tenantId || 
         (req.user.role !== 'salon_admin' && req.user.id !== stylist.id))) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this stylist'
      });
    }

    // Fields that can be updated
    const updatableFields = [
      'firstName', 
      'lastName', 
      'email', 
      'profile',
      'services',
      'isActive'
    ];

    // Only salon_admin or system_admin can update role
    if (['salon_admin', 'system_admin'].includes(req.user.role)) {
      updatableFields.push('role');
    }

    // Create update object with only updatable fields
    const updateData = {};
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle profile updates (to merge instead of replace)
    if (req.body.profile) {
      updateData.profile = { ...stylist.profile, ...req.body.profile };
    }

    // Validate role if being updated
    if (updateData.role) {
      const allowedRoles = ['stylist', 'salon_staff', 'salon_admin'];
      if (!allowedRoles.includes(updateData.role)) {
        return res.status(400).json({
          success: false,
          message: `Role must be one of: ${allowedRoles.join(', ')}`
        });
      }
    }

    // Update the stylist
    const updatedStylist = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    res.status(200).json({
      success: true,
      message: 'Stylist updated successfully',
      stylist: updatedStylist
    });
  } catch (error) {
    console.error('Error updating stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stylist',
      error: error.message
    });
  }
};

/**
 * Delete a stylist
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
const deleteStylist = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid stylist ID format'
      });
    }

    // Find the stylist
    const stylist = await User.findById(id);

    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Only salon owner/admin or system admin can delete stylists
    if (req.user.role !== 'system_admin' && 
        (req.user.tenantId !== stylist.tenantId || req.user.role !== 'salon_admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this stylist'
      });
    }

    // Soft delete by marking as inactive
    await User.findByIdAndUpdate(id, { 
      isActive: false,
      deactivatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Stylist deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stylist',
      error: error.message
    });
  }
};

module.exports = {
  createStylist,
  getAllStylists,
  getStylistById,
  getStylistByStylistId,
  updateStylist,
  deleteStylist
}; 