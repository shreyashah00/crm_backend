const { prisma } = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { formatDateString } = require('./leadService');

/**
 * Gets activities with filtering options
 */
async function getActivities({ leadId, staffId, type, startDate, endDate, page = 0, size = 50 }) {
  const pageNum = parseInt(page);
  const sizeNum = parseInt(size);
  const skip = pageNum * sizeNum;

  const where = {};
  if (leadId) where.leadId = parseInt(leadId);
  if (staffId) where.createdById = parseInt(staffId);
  if (type) where.type = type;

  if (startDate || endDate) {
    where.occurredAt = {};
    if (startDate) where.occurredAt.gte = new Date(startDate);
    if (endDate) where.occurredAt.lte = new Date(endDate);
  }

  const total = await prisma.activity.count({ where });

  const activities = await prisma.activity.findMany({
    where,
    skip,
    take: sizeNum,
    orderBy: { occurredAt: 'desc' },
    include: {
      createdBy: true,
      lead: true,
    },
  });

  const content = activities.map((act) => ({
    id: act.id,
    type: act.type,
    occurredAt: formatDateString(act.occurredAt),
    remarks: act.remarks,
    leadId: act.leadId,
    lead: act.lead ? {
      id: act.lead.id,
      organizationName: act.lead.organizationName,
      contactName: act.lead.contactName,
      phone: act.lead.phone,
      status: act.lead.status,
    } : null,
    createdBy: act.createdBy ? {
      id: act.createdBy.id,
      name: act.createdBy.name,
      email: act.createdBy.email,
      role: act.createdBy.role,
    } : null,
  }));

  return {
    content,
    total,
    page: pageNum,
    limit: sizeNum,
    totalPages: Math.ceil(total / sizeNum),
  };
}

/**
 * Creates a standalone activity log
 */
async function createActivity(data, user) {
  const leadId = parseInt(data.leadId);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }

  if (user.role === 'SALES' && lead.assignedToId !== user.id) {
    throw ApiError.forbidden('This lead is read-only for the selected staff role');
  }

  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();

  const newActivity = await prisma.activity.create({
    data: {
      type: data.type,
      remarks: data.remarks,
      occurredAt,
      leadId,
      createdById: user.id,
    },
    include: {
      createdBy: true,
      lead: true,
    },
  });

  if (data.nextActionDate !== undefined) {
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
      },
    });
  }

  return {
    id: newActivity.id,
    type: newActivity.type,
    occurredAt: formatDateString(newActivity.occurredAt),
    remarks: newActivity.remarks,
    leadId: newActivity.leadId,
    createdBy: {
      id: newActivity.createdBy.id,
      name: newActivity.createdBy.name,
    },
  };
}

module.exports = {
  getActivities,
  createActivity,
};
