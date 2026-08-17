const ApiError = require('../utils/ApiError');
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Handle Custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Handle Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  // Handle Prisma Database Errors
  if (err.code) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation (e.g. email)
        const targetField = err.meta?.target?.join(', ') || 'field';
        return res.status(400).json({
          success: false,
          message: `A record with this ${targetField} already exists.`,
          errors: [{ field: targetField, message: 'Must be unique' }],
        });
      }
      case 'P2025': {
        // Record not found
        return res.status(404).json({
          success: false,
          message: err.meta?.cause || 'Record not found',
          errors: [],
        });
      }
      case 'P2003': {
        // Foreign key constraint failure
        return res.status(400).json({
          success: false,
          message: 'Foreign key constraint failed. Relational entity does not exist.',
          errors: [],
        });
      }
    }
  }

  // Handle jsonwebtoken errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization token',
      errors: [],
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authorization token has expired',
      errors: [],
    });
  }

  // Default: Internal Server Error (500)
  const isProduction = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    message: err.message || 'An unexpected error occurred',
    errors: isProduction ? [] : [err.stack],
  });
}

module.exports = errorHandler;
