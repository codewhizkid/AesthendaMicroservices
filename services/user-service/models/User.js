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
    required: true,
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
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

module.exports = mongoose.model('User', UserSchema); 