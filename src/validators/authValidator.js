const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  userId: z.number().int().positive().optional(), // For bypass/showcase role switching
}).refine(data => (data.email && data.password) || data.userId, {
  message: "Either email and password OR userId must be provided",
  path: ["email"]
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES']).optional().default('SALES'),
  designation: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().default('password123'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

module.exports = {
  loginSchema,
  registerSchema,
  changePasswordSchema,
};
