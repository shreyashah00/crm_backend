const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to authenticate requests via JWT
 */
async function auth(req, res, next) {
  try {
    let token = null;

    // 1. Check Authorization Header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Check cookies (for security flexibility)
    if (!token && req.cookies) {
      token = req.cookies.access_token || req.cookies.crm_token;
    }

    if (!token) {
      return next(ApiError.unauthorized('No authentication token provided'));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'smart-crm-mulyankan-super-secret-access-token-key-2026');
    } catch (err) {
      return next(ApiError.unauthorized('Invalid or expired authentication token'));
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        designation: true,
      },
    });

    if (!user) {
      return next(ApiError.unauthorized('Authenticated user no longer exists'));
    }

    if (!user.active) {
      return next(ApiError.forbidden('This user account has been deactivated'));
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware to restrict access based on roles
 * @param {...string} allowedRoles - roles allowed to access the route
 */
function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to perform this action')
      );
    }

    next();
  };
}

module.exports = {
  auth,
  restrictTo,
};
