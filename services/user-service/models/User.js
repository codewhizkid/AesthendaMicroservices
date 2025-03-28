const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { generateUniqueId } = require('../utils/tokenHelper');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String, 
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tenantId: {
    type: String,
    required: true,
    index: true,
    default: function() {
      return config.getEnv('DEFAULT_TENANT_ID', 'default');
    }
  },
  role: {
    type: String,
    enum: ['client', 'stylist', 'salon_staff', 'salon_admin', 'system_admin'],
    default: 'client'
  },
  stylist_id: {
    type: String,
    sparse: true,  // Only index non-null values
    index: true,   // Index for faster lookup
    default: null  // Only set for staff members
  },
  customRoles: [{
    name: String,
    permissions: [String]
  }],
  profile: {
    phoneNumber: String,
    title: String,
    bio: String,
    avatar: String,
    preferences: {
      language: {
        type: String,
        default: 'en'
      },
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: true
        },
        push: {
          type: Boolean,
          default: true
        }
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      }
    }
  },
  services: [{
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    },
    name: String,
    duration: Number, // in minutes
    price: Number
  }],
  refreshTokens: [{
    token: String,
    expires: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  passwordReset: {
    token: String,
    expiry: Date,
    required: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deactivatedAt: Date,
  lastLogin: Date,
  oauthProviders: {
    google: {
      id: String,
      token: String,
      email: String,
      name: String
    },
    facebook: {
      id: String,
      token: String,
      email: String,
      name: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for performance optimization (common queries)
UserSchema.index({ email: 1 });
UserSchema.index({ tenantId: 1, role: 1 });
UserSchema.index({ tenantId: 1, stylist_id: 1 }, { sparse: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // If user has a staff role and no stylist_id, generate one
    if (['stylist', 'salon_staff', 'salon_admin'].includes(this.role) && !this.stylist_id) {
      // Generate a unique stylist ID if not already set
      this.stylist_id = await this.constructor.generateStylistId(this.tenantId);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Update the timestamp before update
UserSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: new Date() });
});

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Generate JWT token
UserSchema.methods.generateAuthToken = function() {
  const tokenData = {
    id: this._id,
    email: this.email,
    role: this.role,
    tenantId: this.tenantId
  };
  
  // Add stylist_id to token if present
  if (this.stylist_id) {
    tokenData.stylist_id = this.stylist_id;
  }

  return jwt.sign(
    tokenData,
    config.jwt.secret,
    { expiresIn: config.jwt.expiry }
  );
};

// Generate refresh token
UserSchema.methods.generateRefreshToken = function() {
  const tokenData = {
    id: this._id,
    email: this.email,
    type: 'refresh',
    tenantId: this.tenantId
  };
  
  // Add stylist_id to token if present
  if (this.stylist_id) {
    tokenData.stylist_id = this.stylist_id;
  }

  // Create the token with a longer expiry
  const token = jwt.sign(
    tokenData,
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  // Calculate the expiry date
  const expiry = new Date();
  expiry.setSeconds(expiry.getSeconds() + parseInt(config.jwt.refreshExpiry));

  // Add to refresh tokens array
  this.refreshTokens.push({
    token,
    expires: expiry
  });

  // Limit the number of refresh tokens
  const maxTokens = 5;
  if (this.refreshTokens.length > maxTokens) {
    this.refreshTokens = this.refreshTokens.slice(-maxTokens);
  }

  return { token, expires: expiry };
};

// Check if user has permission
UserSchema.methods.hasPermission = function(permission) {
  // System admin has all permissions
  if (this.role === 'system_admin') return true;
  
  // Role-based permissions
  const rolePermissions = {
    client: ['view_own_appointments', 'book_appointment'],
    stylist: ['view_own_appointments', 'manage_own_appointments', 'view_own_clients'],
    salon_staff: ['view_all_appointments', 'manage_appointments', 'view_clients'],
    salon_admin: ['view_all_appointments', 'manage_appointments', 'manage_staff', 'manage_services', 'view_clients', 'manage_salon']
  };
  
  // Check if user's role has the required permission
  if (rolePermissions[this.role] && rolePermissions[this.role].includes(permission)) {
    return true;
  }
  
  // Check if user has custom role with permission
  if (this.customRoles && this.customRoles.length > 0) {
    return this.customRoles.some(role => role.permissions.includes(permission));
  }
  
  return false;
};

// Check if user can access appointments
UserSchema.methods.canAccessAppointment = function(appointment) {
  // Quick rejects - always check tenant first
  if (this.tenantId !== appointment.tenantId) {
    // System admins are the only exception
    if (this.role === 'system_admin') return true;
    return false;
  }
  
  // Role-based checks
  switch(this.role) {
    case 'system_admin':
    case 'salon_admin':
    case 'salon_staff':
      return true;
    case 'stylist':
      return this.stylist_id === appointment.stylist_id;
    case 'client':
      return this._id.toString() === appointment.clientId.toString();
    default:
      return false;
  }
};

// Static method to find by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by stylist_id
UserSchema.statics.findByStylistId = function(stylist_id, tenantId) {
  return this.findOne({ stylist_id, tenantId });
};

// Static method to generate a unique stylist ID
UserSchema.statics.generateStylistId = async function(tenantId) {
  let isUnique = false;
  let stylistId;
  
  // Keep generating until we find a unique one
  while (!isUnique) {
    // Generate stylist ID with prefix (e.g., STY12345678)
    stylistId = generateUniqueId('STY');
    
    // Check if it already exists
    const existingUser = await this.findOne({ 
      stylist_id: stylistId,
      tenantId
    });
    
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return stylistId;
};

// Add timestamps for tracking createdAt and updatedAt
UserSchema.set('timestamps', true);

module.exports = mongoose.model('User', UserSchema);