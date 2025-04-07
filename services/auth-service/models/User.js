const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { tenantModel } = require('../../shared/middleware/tenantContext');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
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
  role: {
    type: String,
    enum: ['ADMIN', 'MANAGER', 'STYLIST', 'CLIENT'],
    default: 'CLIENT'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  profileImage: String,
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: String,
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
    }
  },
  refreshTokens: [{
    token: String,
    expiresAt: Date
  }],
  lastLogin: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  fcmTokens: [String], // Firebase Cloud Messaging tokens for push notifications
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Apply tenant model plugin
tenantModel(userSchema);

// Indexes
userSchema.index({ email: 1, tenantId: 1 }, { unique: true });
userSchema.index({ role: 1, tenantId: 1 });
userSchema.index({ status: 1, tenantId: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update passwordChangedAt timestamp
    this.passwordChangedAt = Date.now();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Clean up expired refresh tokens before saving
userSchema.pre('save', function(next) {
  if (this.refreshTokens?.length) {
    const now = Date.now();
    this.refreshTokens = this.refreshTokens.filter(token => 
      token.expiresAt > now
    );
  }
  next();
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.hasPermission = function(permission) {
  const rolePermissions = {
    ADMIN: ['*'],
    MANAGER: ['manage_stylists', 'manage_appointments', 'view_reports'],
    STYLIST: ['manage_own_appointments', 'view_own_schedule'],
    CLIENT: ['book_appointments', 'view_own_appointments']
  };

  const userPermissions = rolePermissions[this.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
};

userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

userSchema.methods.addFCMToken = function(token) {
  if (!this.fcmTokens.includes(token)) {
    this.fcmTokens.push(token);
  }
};

userSchema.methods.removeFCMToken = function(token) {
  this.fcmTokens = this.fcmTokens.filter(t => t !== token);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 