import { Schema } from 'mongoose';
import { createSchema, createModel, BaseDocument } from './BaseModel';
import { UserRole } from '../types';

/**
 * User document interface with tenant isolation
 */
export interface UserDocument extends BaseDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
}

/**
 * User schema definition
 */
const userSchemaDefinition = {
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CLIENT
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
};

/**
 * Create user schema with tenant isolation
 */
const userSchema = createSchema(userSchemaDefinition, {
  // Add any additional schema options here
  collection: 'users',
});

// Add custom instance methods
userSchema.methods.toPublicJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

// Add additional static methods if needed
userSchema.statics.findByEmail = async function(email, tenantId) {
  return this.findOne({ email, tenantId });
};

/**
 * Create and export the User model
 */
export const User = createModel<UserDocument>('User', userSchema);

export default User; 