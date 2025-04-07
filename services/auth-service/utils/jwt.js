const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate access token with tenant context
 */
const generateAccessToken = (user, tenant) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Generate refresh token with tenant context
 */
const generateRefreshToken = (user, tenant) => {
  return jwt.sign(
    {
      userId: user._id,
      tenantId: tenant._id,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

/**
 * Verify and decode JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
};

/**
 * Generate tokens for user
 */
const generateTokens = async (user, tenant) => {
  const accessToken = generateAccessToken(user, tenant);
  const refreshToken = generateRefreshToken(user, tenant);

  // Store refresh token hash in user document
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: jwt.decode(refreshToken).exp * 1000
  });

  // Keep only the last 5 refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();

  return {
    accessToken,
    refreshToken,
    expiresIn: jwt.decode(accessToken).exp * 1000
  };
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (refreshToken) => {
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

    return {
      accessToken,
      expiresIn: jwt.decode(accessToken).exp * 1000
    };
  } catch (error) {
    throw new Error(`Failed to refresh token: ${error.message}`);
  }
};

/**
 * Revoke refresh token
 */
const revokeRefreshToken = async (userId, refreshToken) => {
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
const revokeAllRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.refreshTokens = [];
  await user.save();
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTokens,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllRefreshTokens
}; 