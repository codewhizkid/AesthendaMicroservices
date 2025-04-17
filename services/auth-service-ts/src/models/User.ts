import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { BaseDocument, createSchema, createModel } from './BaseModel';
import { UserRole } from '../types';

/**
 * User document interface with tenant isolation
 */
export interface UserDocument extends BaseDocument {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  phoneNumber?: string;
  profileImage?: string;
  preferences: {
    language: string;
    timezone?: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  refreshTokens: Array<{
    token: string;
    expiresAt: Date;
  }>;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  fcmTokens: string[];
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasPermission(permission: string): boolean;
  generatePasswordResetToken(): string;
  generateEmailVerificationToken(): string;
  addFCMToken(token: string): void;
  removeFCMToken(token: string): void;
}

/**
 * User schema definition
 */
const userSchemaDefinition = {
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CLIENT
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
  fcmTokens: [String] // Firebase Cloud Messaging tokens for push notifications
};

/**
 * Create user schema with tenant isolation
 */
const userSchema = createSchema(userSchemaDefinition);

// Virtual for full name
userSchema.virtual('fullName').get(function(this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware for password hashing
userSchema.pre<UserDocument>('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update passwordChangedAt timestamp
    this.passwordChangedAt = new Date();
    
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

// Clean up expired refresh tokens before saving
userSchema.pre<UserDocument>('save', function(next) {
  if (this.refreshTokens?.length) {
    const now = new Date();
    this.refreshTokens = this.refreshTokens.filter(token => 
      token.expiresAt > now
    );
  }
  next();
});

// Add methods

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    [UserRole.ADMIN]: ['*'],
    [UserRole.STYLIST]: ['manage_own_appointments', 'view_own_schedule'],
    [UserRole.CLIENT]: ['book_appointments', 'view_own_appointments'],
    [UserRole.RECEPTIONIST]: ['manage_appointments', 'view_schedules'],
    [UserRole.SYSTEM]: ['*']
  };

  const userPermissions = rolePermissions[this.role] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  
  return resetToken;
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function(): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return verificationToken;
};

// Add FCM token for push notifications
userSchema.methods.addFCMToken = function(token: string): void {
  if (!this.fcmTokens.includes(token)) {
    this.fcmTokens.push(token);
  }
};

// Remove FCM token
userSchema.methods.removeFCMToken = function(token: string): void {
  this.fcmTokens = this.fcmTokens.filter((t: string) => t !== token);
};

/**
 * Create and export the User model
 */
export const User = createModel<UserDocument>('User', userSchema);

export default User; 