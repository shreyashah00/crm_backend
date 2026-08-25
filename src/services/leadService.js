const { prisma } = require('../lib/prisma');
const ApiError = require('../utils/ApiError');

// Helper to format Date objects as YYYY-MM-DD string
function formatDateString(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// Helper to map DB lead model to exact frontend payload structure
function mapLeadToFrontend(lead) {
  if (!lead) return null;
  return {
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
      active: lead.assignedTo.active,
      designation: lead.assignedTo.designation,
    } : null,
    activities: (lead.activities || []).map(act => ({
      id: act.id,
      type: act.type,
      occurredAt: formatDateString(act.occurredAt),
      remarks: act.remarks,
      createdBy: {
        id: act.createdBy.id,
        name: act.createdBy.name,
        email: act.createdBy.email,
        role: act.createdBy.role,
        active: act.createdBy.active,
        designation: act.createdBy.designation,
      }
    })),
  };
}

/**
 * Gets all leads with pagination, search, and status filter
 */
async function getLeads({ q = '', status = '', page = 0, size = 25 }) {
  const pageNum = parseInt(page);
  const sizeNum = parseInt(size);
  const skip = pageNum * sizeNum;

  // Search filter options
  const searchFilter = q ? {
    OR: [
      { organizationName: { contains: q, mode: 'insensitive' } },
      { contactName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ]
  } : {};

  // Status filter options
  const statusFilter = status ? { status: status } : {};

  // Combine filters
  const where = {
    ...searchFilter,
    ...statusFilter,
  };

  // Get total count
  const total = await prisma.lead.count({ where });

  // Get leads list
  const leads = await prisma.lead.findMany({
    where,
    skip: skip,
    take: sizeNum,
    orderBy: { id: 'desc' }, // Order by newest added
    include: {
      assignedTo: true,
      activities: {
        orderBy: { occurredAt: 'desc' },
        include: { createdBy: true },
      },
    },
  });

  const content = leads.map(mapLeadToFrontend);
  const totalPages = Math.ceil(total / sizeNum);

  return {
    content,
    total,
    totalPages,
    page: pageNum,
    limit: sizeNum,
  };
}

/**
 * Gets a single lead by ID
 */
async function getLeadById(id) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      activities: {
        orderBy: { occurredAt: 'desc' },
        include: { createdBy: true },
      },
    },
  });

  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }

  return mapLeadToFrontend(lead);
}

/**
 * Creates a new lead in the database
 */
async function createLead(data, creatorUser) {
  // If user is SALES, force lead assignment to themselves.
  let assignedToId = data.assignedToId;
  if (creatorUser.role === 'SALES') {
    assignedToId = creatorUser.id;
  }

  const newLead = await prisma.lead.create({
    data: {
      organizationName: data.organizationName,
      contactName: data.contactName,
      designation: data.designation,
      phone: data.phone,
      email: data.email,
      province: data.province,
      district: data.district,
      source: data.source,
      leadType: data.leadType,
      priority: data.priority,
      status: data.status,
      nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
      notes: data.notes,
      assignedToId: assignedToId,
      dateAdded: new Date(),
    },
    include: {
      assignedTo: true,
      activities: {
        include: { createdBy: true },
      },
    },
  });

  return mapLeadToFrontend(newLead);
}

/**
 * Updates a lead in the database
 */
async function updateLead(id, data, user) {
  const lead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }

  // Restrict SALES role: can only edit own assigned leads
  if (user.role === 'SALES' && lead.assignedToId !== user.id) {
    throw ApiError.forbidden('This lead is read-only for the selected staff role');
  }

  // Prep data updates
  const updateData = { ...data };

  // Format dates if provided
  if (data.nextActionDate !== undefined) {
    updateData.nextActionDate = data.nextActionDate ? new Date(data.nextActionDate) : null;
  }

  // Restrict SALES role: cannot reassign lead to other users
  if (user.role === 'SALES') {
    delete updateData.assignedToId;
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: updateData,
    include: {
      assignedTo: true,
      activities: {
        orderBy: { occurredAt: 'desc' },
        include: { createdBy: true },
      },
    },
  });

  return mapLeadToFrontend(updatedLead);
}

/**
 * Creates a log/activity for a lead
 */
async function createLeadActivity(leadId, data, user) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }

  // Restrict SALES role: can only log activities on own assigned leads
  if (user.role === 'SALES' && lead.assignedToId !== user.id) {
    throw ApiError.forbidden('This lead is read-only for the selected staff role');
  }

  // Create the activity record
  const occurredAt = data.occurredAt ? new Date(data.occurredAt) : new Date();

  await prisma.activity.create({
    data: {
      type: data.type,
      remarks: data.remarks,
      occurredAt,
      leadId: leadId,
      createdById: user.id,
    },
  });

  // If nextActionDate is specified in activity log, update the lead's nextActionDate
  const leadUpdates = {};
  if (data.nextActionDate !== undefined) {
    leadUpdates.nextActionDate = data.nextActionDate ? new Date(data.nextActionDate) : null;
  }

  // Fetch updated lead with new activities included
  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: leadUpdates,
    include: {
      assignedTo: true,
      activities: {
        orderBy: { occurredAt: 'desc' },
        include: { createdBy: true },
      },
    },
  });

  return mapLeadToFrontend(updatedLead);
}

/**
 * Deletes a lead by ID
 */
async function deleteLead(id, user) {
  const lead = await prisma.lead.findUnique({
    where: { id },
  });

  if (!lead) {
    throw ApiError.notFound('Lead not found');
  }

  if (user.role === 'SALES' && lead.assignedToId !== user.id) {
    throw ApiError.forbidden('You can only delete leads assigned to you');
  }

  await prisma.lead.delete({
    where: { id },
  });

  return { success: true, message: 'Lead deleted successfully' };
}

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  createLeadActivity,
  mapLeadToFrontend,
  formatDateString,
};
