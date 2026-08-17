const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const ApiError = require('../utils/ApiError');

const JWT_SECRET = process.env.JWT_SECRET || 'smart-crm-mulyankan-super-secret-access-token-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'smart-crm-mulyankan-super-secret-refresh-token-key-2026';

/**
 * Generates an Access Token
 */
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' } // 1 day access token for smoother demo experience, customizable
  );
}

/**
 * Generates a Refresh Token
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Authenticates user and returns tokens & user profile
 */
async function login({ email, password, userId }) {
  let user;

  // 1. Showcase role switching: login via userId directly (bypass password)
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
  } else {
    // 2. Production login: login via email and password
    user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }
  }

  if (!user.active) {
    throw ApiError.forbidden('This user account has been deactivated');
  }

  // Generate tokens
  const token = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Return formatted response user block
  const userProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    designation: user.designation,
  };

  return {
    token,
    refreshToken,
    user: userProfile,
  };
}

/**
 * Refreshes an access token using a refresh token
 */
async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user || !user.active) {
    throw ApiError.unauthorized('User not found or deactivated');
  }

  const token = generateAccessToken(user);
  return { token };
}

/**
 * Changes user password
 */
async function changePassword(userId, { oldPassword, newPassword }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw ApiError.badRequest('Invalid current password', [{ field: 'oldPassword', message: 'Current password does not match' }]);
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  return { success: true };
}

module.exports = {
  login,
  refreshAccessToken,
  changePassword,
};
