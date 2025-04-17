import jwt from 'jsonwebtoken';
import config from '../config';
import { User, UserDocument } from '../models/User';
import { Tenant, TenantDocument } from '../models/Tenant';
import { UserRole } from '../types';

interface TokenPayload {
  userId: string;
  email?: string;
  role?: UserRole;
  tenantId: string;
  tenantSlug?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate access token with tenant context
 */
export const generateAccessToken = (user: UserDocument, tenant: TenantDocument): string => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: tenant._id.toString(),
      tenantSlug: tenant.slug,
      type: 'access'
    } as TokenPayload,
    config.auth.jwtSecret,
    { expiresIn: config.constants.TOKEN_EXPIRY }
  );
};

/**
 * Generate refresh token with tenant context
 */
export const generateRefreshToken = (user: UserDocument, tenant: TenantDocument): string => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tenantId: tenant._id.toString(),
      type: 'refresh'
    } as TokenPayload,
    config.auth.jwtSecret,
    { expiresIn: config.constants.REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.auth.jwtSecret) as TokenPayload;
  } catch (error) {
    throw new Error(`Invalid token: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generate tokens for user
 */
export const generateTokens = async (user: UserDocument, tenant: TenantDocument): Promise<TokenResponse> => {
  const accessToken = generateAccessToken(user, tenant);
  const refreshToken = generateRefreshToken(user, tenant);

  // Store refresh token in user document
  user.refreshTokens = user.refreshTokens || [];
  const decoded = jwt.decode(refreshToken) as TokenPayload;
  
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(decoded.exp! * 1000)
  });

  // Keep only the last 5 refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();

  return {
    accessToken,
    refreshToken,
    expiresIn: (jwt.decode(accessToken) as TokenPayload).exp! * 1000
  };
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> => {
  try {
    const decoded = verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify refresh token is still valid
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      throw new Error('Invalid refresh token');
    }

    const tenant = await Tenant.findById(decoded.tenantId);
    if (!tenant || !tenant.isActive()) {
      throw new Error('Invalid tenant');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user, tenant);
    const decodedAccess = jwt.decode(accessToken) as TokenPayload;

    return {
      accessToken,
      expiresIn: decodedAccess.exp! * 1000
    };
  } catch (error) {
    throw new Error(`Failed to refresh token: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
  await user.save();
};

/**
 * Revoke all refresh tokens for user
 */
export const revokeAllRefreshTokens = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.refreshTokens = [];
  await user.save();
}; 