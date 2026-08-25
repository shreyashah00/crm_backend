const { prisma } = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { mapLeadToFrontend, formatDateString } = require('./leadService');

/**
 * Gets all leads grouped by pipeline stage
 */
async function getPipelineLeads(user) {
  const isSales = user.role === 'SALES';
  const where = isSales ? { assignedToId: user.id } : {};

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { id: 'desc' },
    include: {
      assignedTo: true,
      activities: {
        orderBy: { occurredAt: 'desc' },
        include: { createdBy: true },
      },
    },
  });

  const stages = {
    NEW_LEAD: [],
    IN_PROGRESS: [],
    LIKELY_WARM: [],
    ON_HOLD: [],
    CONVERTED: [],
    NOT_INTERESTED: [],
  };

  leads.forEach((lead) => {
    const formatted = {
      id: lead.id,
      organizationName: lead.organizationName,
      contactName: lead.contactName,
      designation: lead.designation,
      phone: lead.phone,
      email: lead.email,
      province: lead.province,
      district: lead.district,
      source: lead.source,
      leadType: lead.leadType,
      dateAdded: formatDateString(lead.dateAdded),
      priority: lead.priority,
      status: lead.status,
      nextActionDate: formatDateString(lead.nextActionDate),
      notes: lead.notes,
      assignedTo: lead.assignedTo ? {
        id: lead.assignedTo.id,
        name: lead.assignedTo.name,
        email: lead.assignedTo.email,
        role: lead.assignedTo.role,
      } : null,
    };

    if (stages[lead.status]) {
      stages[lead.status].push(formatted);
    }
  });

  return stages;
}

/**
 * Updates a lead status (pipeline stage transition)
 */
async function updateLeadStage(leadId, status, user) {
  const validStatuses = ['NEW_LEAD', 'IN_PROGRESS', 'LIKELY_WARM', 'ON_HOLD', 'CONVERTED', 'NOT_INTERESTED'];
  if (!validStatuses.includes(status)) {
    throw ApiError.badRequest(`Invalid pipeline status: ${status}`);
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }

  if (user.role === 'SALES' && lead.assignedToId !== user.id) {
    throw ApiError.forbidden('This lead is read-only for the selected staff role');
  }

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: { status },
    include: {
      assignedTo: true,
      activities: {
        orderBy: { occurredAt: 'desc' },
        include: { createdBy: true },
      },
    },
  });

  return {
    id: updatedLead.id,
    organizationName: updatedLead.organizationName,
    status: updatedLead.status,
    previousStatus: lead.status,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getPipelineLeads,
  updateLeadStage,
};
