const { z } = require('zod');

// Regex for YYYY-MM-DD validation
const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

const createLeadSchema = z.object({
  organizationName: z.string().min(1, 'School or Organization name is required'),
  contactName: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email format').or(z.literal('')).optional().nullable(),
  province: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  leadType: z.string().optional().nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  status: z.enum(['NEW_LEAD', 'IN_PROGRESS', 'LIKELY_WARM', 'CONVERTED', 'NOT_INTERESTED', 'ON_HOLD']).default('NEW_LEAD'),
  nextActionDate: z.string().regex(dateStringRegex, 'Date must be in YYYY-MM-DD format').or(z.literal('')).optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedToId: z.number().int().positive().optional().nullable(),
});

const updateLeadSchema = z.object({
  organizationName: z.string().min(1, 'School or Organization name is required').optional(),
  contactName: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email format').or(z.literal('')).optional().nullable(),
  province: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  leadType: z.string().optional().nullable(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['NEW_LEAD', 'IN_PROGRESS', 'LIKELY_WARM', 'CONVERTED', 'NOT_INTERESTED', 'ON_HOLD']).optional(),
  nextActionDate: z.string().regex(dateStringRegex, 'Date must be in YYYY-MM-DD format').or(z.literal('')).optional().nullable(),
  notes: z.string().optional().nullable(),
  assignedToId: z.number().int().positive().optional().nullable(),
});

const createActivitySchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'PHYSICAL_MEETING', 'ONLINE_MEETING', 'WHATSAPP_SMS', 'NOTE'], {
    errorMap: () => ({ message: 'Invalid activity type' }),
  }),
  occurredAt: z.string().regex(dateStringRegex, 'occurredAt must be in YYYY-MM-DD format').optional(),
  remarks: z.string().optional().nullable(),
  nextActionDate: z.string().regex(dateStringRegex, 'nextActionDate must be in YYYY-MM-DD format').or(z.literal('')).optional().nullable(),
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  createActivitySchema,
};
