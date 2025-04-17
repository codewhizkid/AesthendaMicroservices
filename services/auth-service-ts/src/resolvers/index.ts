import { applyTenantIsolation } from '../utils/resolverUtils';
import { Context, UserRole } from '../types';
import { User } from '../models/User';
import { Tenant } from '../models/Tenant';
import * as jwt from '../utils/jwt';
import { GraphQLError } from 'graphql';
import crypto from 'crypto';

// Email sending stub (would be replaced with actual email service)
const sendEmail = async (to: string, subject: string, text: string) => {
  console.log(`Would send email to ${to} with subject "${subject}": ${text}`);
  // In a real implementation, this would use nodemailer or another email service
  return true;
};

// Basic resolver map before applying tenant isolation
const baseResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      const user = await User.findById(context.user.id);
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' }
        });
      }
      return user;
    },
    user: async (_: any, { id }: { id: string }, context: Context) => {
      // Authorization check - only admins can view other users
      if (context.user.id !== id && !context.user.roles.includes(UserRole.ADMIN)) {
        throw new GraphQLError('Not authorized to view this user', {
          extensions: { code: 'FORBIDDEN' }
        });
      }
      
      // Use findOne with both id and tenantId for tenant isolation
      return User.findOne({ _id: id, tenantId: context.user.tenantId });
    },
    verifyResetToken: async (_: any, { token }: { token: string }) => {
      try {
        // Hash the token to compare with stored hash
        const hashedToken = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');
        
        // Find user with this token and check if it's still valid
        const user = await User.findOne({
          passwordResetToken: hashedToken,
          passwordResetExpires: { $gt: new Date() }
        });
        
        if (!user) {
          return {
            success: false,
            message: 'Password reset token is invalid or has expired'
          };
        }
        
        return {
          success: true,
          message: 'Token is valid'
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Invalid token'
        };
      }
    }
  },
  Mutation: {
    register: async (_: any, { input }: any) => {
      try {
        // Find tenant
        const tenant = await Tenant.findById(input.tenantId);
        if (!tenant) {
          throw new GraphQLError('Tenant not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        // Create user
        const user = new User({
          ...input,
          status: 'ACTIVE',
          emailVerified: false,
          refreshTokens: [],
          fcmTokens: []
        });
        
        await user.save();
        
        // Generate verification token and send verification email
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();
        
        // Construct verification URL
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        // Send verification email
        await sendEmail(
          user.email,
          'Verify Your Email',
          `Please verify your email by clicking the following link: ${verificationUrl}\nIf you didn't create this account, please ignore this email.`
        );
        
        // Generate tokens
        const tokens = await jwt.generateTokens(user, tenant);
        
        return {
          ...tokens,
          user
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('duplicate key')) {
          throw new GraphQLError('Email already in use', {
            extensions: { code: 'BAD_USER_INPUT' }
          });
        }
        throw error;
      }
    },
    login: async (_: any, { email, password, tenantId }: { email: string, password: string, tenantId: string }) => {
      try {
        // Find tenant
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
          throw new GraphQLError('Tenant not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        // Find user with this email in this tenant
        // Use +password to include the password field which is excluded by default
        const user = await User.findOne({ email, tenantId }).select('+password');
        if (!user) {
          throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'UNAUTHORIZED' }
          });
        }
        
        // Check if user is active
        if (user.status !== 'ACTIVE') {
          throw new GraphQLError('Your account is disabled', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
        
        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
          throw new GraphQLError('Invalid email or password', {
            extensions: { code: 'UNAUTHORIZED' }
          });
        }
        
        // Update last login timestamp
        user.lastLogin = new Date();
        await user.save();
        
        // Generate tokens
        const tokens = await jwt.generateTokens(user, tenant);
        
        return {
          ...tokens,
          user
        };
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        console.error('Login error:', error);
        throw new GraphQLError('Authentication failed', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },
    refreshToken: async (_: any, { refreshToken }: { refreshToken: string }) => {
      try {
        // Use the JWT utility to refresh the token
        const result = await jwt.refreshAccessToken(refreshToken);
        
        return {
          ...result,
          success: true
        };
      } catch (error) {
        console.error('Token refresh error:', error);
        throw new GraphQLError(
          error instanceof Error ? error.message : 'Failed to refresh token',
          { extensions: { code: 'UNAUTHORIZED' } }
        );
      }
    },
    logout: async (_: any, { refreshToken }: { refreshToken: string }, context: Context) => {
      try {
        // Verify refresh token and extract user ID
        const decoded = jwt.verifyToken(refreshToken);
        
        // Revoke the refresh token
        await jwt.revokeRefreshToken(decoded.userId, refreshToken);
        
        return true;
      } catch (error) {
        console.error('Logout error:', error);
        return false;
      }
    },
    logoutAll: async (_: any, __: any, context: Context) => {
      try {
        // Revoke all refresh tokens for the current user
        await jwt.revokeAllRefreshTokens(context.user.id);
        
        return true;
      } catch (error) {
        console.error('Logout all error:', error);
        return false;
      }
    },
    requestPasswordReset: async (_: any, { email, tenantId }: { email: string, tenantId: string }) => {
      try {
        // Find user with this email in the specified tenant
        const user = await User.findOne({ email, tenantId });
        
        // If no user found, we still return success to prevent email enumeration
        if (!user) {
          return {
            success: true,
            message: 'If your email is registered, you will receive a password reset link shortly'
          };
        }
        
        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();
        
        // Construct reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        // Send email with reset link
        await sendEmail(
          user.email,
          'Password Reset Request',
          `You requested a password reset. Please use the following link to reset your password: ${resetUrl}\nIf you didn't request this, please ignore this email.`
        );
        
        return {
          success: true,
          message: 'If your email is registered, you will receive a password reset link shortly'
        };
      } catch (error) {
        console.error('Password reset request error:', error);
        return {
          success: false,
          message: 'Could not process your request. Please try again later.'
        };
      }
    },
    resetPassword: async (_: any, { token, newPassword }: { token: string, newPassword: string }) => {
      try {
        // Hash the token to compare with stored hash
        const hashedToken = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');
        
        // Find user with this token and check if it's still valid
        const user = await User.findOne({
          passwordResetToken: hashedToken,
          passwordResetExpires: { $gt: new Date() }
        });
        
        if (!user) {
          return {
            success: false,
            message: 'Password reset token is invalid or has expired'
          };
        }
        
        // Update password and clear reset token
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        
        // Save user with password hashing middleware handling the hashing
        await user.save();
        
        return {
          success: true,
          message: 'Your password has been reset successfully'
        };
      } catch (error) {
        console.error('Password reset error:', error);
        return {
          success: false,
          message: 'Could not reset your password. Please try again later.'
        };
      }
    },
    verifyEmail: async (_: any, { token }: { token: string }) => {
      try {
        // Hash the token to compare with stored hash
        const hashedToken = crypto
          .createHash('sha256')
          .update(token)
          .digest('hex');
        
        // Find user with this token and check if it's still valid
        const user = await User.findOne({
          emailVerificationToken: hashedToken,
          emailVerificationExpires: { $gt: new Date() }
        });
        
        if (!user) {
          return {
            success: false,
            message: 'Email verification token is invalid or has expired'
          };
        }
        
        // Mark email as verified and clear verification token
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        
        await user.save();
        
        return {
          success: true,
          message: 'Your email has been verified successfully'
        };
      } catch (error) {
        console.error('Email verification error:', error);
        return {
          success: false,
          message: 'Could not verify your email. Please try again later.'
        };
      }
    },
    resendVerification: async (_: any, { email, tenantId }: { email: string, tenantId: string }) => {
      try {
        // Find user with this email in the specified tenant
        const user = await User.findOne({ email, tenantId });
        
        // If no user found or already verified, we still return success to prevent email enumeration
        if (!user || user.emailVerified) {
          return {
            success: true,
            message: 'If your email is registered and not verified, you will receive a verification link shortly'
          };
        }
        
        // Generate verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();
        
        // Construct verification URL
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        
        // Send verification email
        await sendEmail(
          user.email,
          'Verify Your Email',
          `Please verify your email by clicking the following link: ${verificationUrl}\nIf you didn't create this account, please ignore this email.`
        );
        
        return {
          success: true,
          message: 'If your email is registered and not verified, you will receive a verification link shortly'
        };
      } catch (error) {
        console.error('Resend verification error:', error);
        return {
          success: false,
          message: 'Could not process your request. Please try again later.'
        };
      }
    },
    updateProfile: async (_: any, { input }: { input: any }, context: Context) => {
      try {
        const user = await User.findById(context.user.id);
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        // Update allowed fields
        if (input.firstName) user.firstName = input.firstName;
        if (input.lastName) user.lastName = input.lastName;
        if (input.phoneNumber) user.phoneNumber = input.phoneNumber;
        if (input.profileImage) user.profileImage = input.profileImage;
        
        // Update preferences if provided
        if (input.preferences) {
          if (input.preferences.language) user.preferences.language = input.preferences.language;
          if (input.preferences.timezone) user.preferences.timezone = input.preferences.timezone;
          
          // Update notification preferences if provided
          if (input.preferences.notifications) {
            if (typeof input.preferences.notifications.email === 'boolean') {
              user.preferences.notifications.email = input.preferences.notifications.email;
            }
            if (typeof input.preferences.notifications.sms === 'boolean') {
              user.preferences.notifications.sms = input.preferences.notifications.sms;
            }
            if (typeof input.preferences.notifications.push === 'boolean') {
              user.preferences.notifications.push = input.preferences.notifications.push;
            }
          }
        }
        
        // Status can only be updated by admins
        if (input.status && context.user.roles.includes(UserRole.ADMIN)) {
          user.status = input.status;
        }
        
        await user.save();
        
        return user;
      } catch (error) {
        console.error('Update profile error:', error);
        throw new GraphQLError(
          'Failed to update profile',
          { extensions: { code: 'INTERNAL_SERVER_ERROR' } }
        );
      }
    },
    changePassword: async (_: any, { currentPassword, newPassword }: { currentPassword: string, newPassword: string }, context: Context) => {
      try {
        // Find user and include password field
        const user = await User.findById(context.user.id).select('+password');
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
          throw new GraphQLError('Current password is incorrect', {
            extensions: { code: 'UNAUTHORIZED' }
          });
        }
        
        // Update password
        user.password = newPassword;
        
        // Save user with password hashing middleware handling the hashing
        await user.save();
        
        return true;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        console.error('Change password error:', error);
        throw new GraphQLError(
          'Failed to change password',
          { extensions: { code: 'INTERNAL_SERVER_ERROR' } }
        );
      }
    },
    updateUserRole: async (_: any, { userId, role }: { userId: string, role: UserRole }, context: Context) => {
      try {
        // Only admins can update roles
        if (!context.user.roles.includes(UserRole.ADMIN)) {
          throw new GraphQLError('Not authorized to update user roles', {
            extensions: { code: 'FORBIDDEN' }
          });
        }
        
        // Find user with tenant isolation
        const user = await User.findOne({ _id: userId, tenantId: context.user.tenantId });
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        
        // Update role
        user.role = role;
        await user.save();
        
        return user;
      } catch (error) {
        if (error instanceof GraphQLError) {
          throw error;
        }
        
        console.error('Update user role error:', error);
        throw new GraphQLError(
          'Failed to update user role',
          { extensions: { code: 'INTERNAL_SERVER_ERROR' } }
        );
      }
    }
  }
};

// Apply tenant isolation to all resolvers
export const resolvers = applyTenantIsolation(baseResolvers); 