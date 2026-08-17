const { z } = require('zod');

const updateTargetSchema = z.object({
  leadTarget: z.number().int().min(0, 'Target must be at least 0').default(0),
  followUpTarget: z.number().int().min(0, 'Target must be at least 0').default(0),
  meetingTarget: z.number().int().min(0, 'Target must be at least 0').default(0),
  conversionTarget: z.number().int().min(0, 'Target must be at least 0').default(0),
  revenueTarget: z.number().int().min(0, 'Target must be at least 0').default(0).optional(),
});

module.exports = {
  updateTargetSchema,
};
