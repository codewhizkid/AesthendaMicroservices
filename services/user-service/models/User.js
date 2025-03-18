const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
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
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if the user doesn't use OAuth
      return !this.oauthProviders || Object.keys(this.oauthProviders).length === 0;
    },
    minlength: 6,
    select: false // Don't return password by default in queries
  },
  role: {
    type: String,
    enum: ['client', 'stylist', 'admin'],
    default: 'client'
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }],
  oauthProviders: {
    google: {
      id: String,
      token: String,
      profile: mongoose.Schema.Types.Mixed
    },
    facebook: {
      id: String,
      token: String,
      profile: mongoose.Schema.Types.Mixed
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new) and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  // If user doesn't have a password (OAuth user), return false
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT access token (short-lived)
UserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key', // Use environment variable in production
    { 
      expiresIn: '15m' // Shorter expiration time for access tokens
    }
  );
};

// Method to generate refresh token (long-lived)
UserSchema.methods.generateRefreshToken = async function() {
  // Create a refresh token with longer expiry
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.REFRESH_TOKEN_SECRET || 'your_refresh_token_secret_key',
    { expiresIn: '7d' } // 7 days
  );
  
  // Calculate expiry date for database storage
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  // Store the refresh token in the user document
  this.refreshTokens.push({ token: refreshToken, expiresAt });
  await this.save();
  
  return refreshToken;
};

// Method to verify a refresh token
UserSchema.methods.verifyRefreshToken = function(refreshToken) {
  // Find the refresh token in the user's tokens array
  const tokenDoc = this.refreshTokens.find(t => t.token === refreshToken);
  
  if (!tokenDoc) {
    return false;
  }
  
  // Check if token is expired
  if (new Date() > tokenDoc.expiresAt) {
    // Remove expired token
    this.refreshTokens = this.refreshTokens.filter(t => t.token !== refreshToken);
    this.save().catch(err => console.error('Error removing expired token:', err));
    return false;
  }
  
  return true;
};

// Method to remove a specific refresh token
UserSchema.methods.removeRefreshToken = async function(refreshToken) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== refreshToken);
  await this.save();
};

// Method to remove all refresh tokens (logout from all devices)
UserSchema.methods.removeAllRefreshTokens = async function() {
  this.refreshTokens = [];
  await this.save();
};

/**
 * Find or create a user from OAuth profile data
 * @param {String} provider - The OAuth provider ('google' or 'facebook')
 * @param {Object} profile - The OAuth profile data
 * @param {String} token - The OAuth access token
 * @returns {Promise<Object>} - The user object and a boolean indicating if it was created
 */
UserSchema.statics.findOrCreateFromOAuth = async function(provider, profile, token) {
  if (!['google', 'facebook'].includes(provider)) {
    throw new Error('Invalid OAuth provider');
  }

  // Try to find user by provider ID
  let user = await this.findOne({
    [`oauthProviders.${provider}.id`]: profile.id
  });

  // If user exists with this OAuth ID, update the token and return
  if (user) {
    user.oauthProviders[provider].token = token;
    user.oauthProviders[provider].profile = profile;
    await user.save();
    return { user, created: false };
  }

  // If no user with this OAuth ID, try to find by email
  if (profile.email) {
    user = await this.findOne({ email: profile.email });
    
    // If found by email, add OAuth provider info
    if (user) {
      if (!user.oauthProviders) {
        user.oauthProviders = {};
      }
      
      user.oauthProviders[provider] = {
        id: profile.id,
        token: token,
        profile: profile
      };
      
      await user.save();
      return { user, created: false };
    }
  }

  // No user found, create a new one
  const name = profile.displayName || 
               profile.name || 
               (profile.firstName && profile.lastName 
                ? `${profile.firstName} ${profile.lastName}` 
                : 'User');
  
  const email = profile.email || `${profile.id}@${provider}.user`;
  
  const newUser = new this({
    name,
    email,
    role: 'client', // Default role for OAuth users
    oauthProviders: {
      [provider]: {
        id: profile.id,
        token,
        profile
      }
    }
  });

  await newUser.save();
  return { user: newUser, created: true };
};

module.exports = mongoose.model('User', UserSchema);