const { prisma } = require('../lib/prisma');
const { formatDateString } = require('./leadService');
const { isLeadOverdue } = require('./staffService');

/**
 * Gets overview dashboard statistics scoped to the user's role and identity
 * @param {object} user - Authenticated user object
 */
async function getDashboardOverview(user) {
  const todayStr = formatDateString(new Date());

  // 1. Fetch leads based on role (SALES only sees assigned leads)
  const isSales = user.role === 'SALES';
  const leadsQueryFilter = isSales ? { assignedToId: user.id } : {};

  const leads = await prisma.lead.findMany({
    where: leadsQueryFilter,
    include: {
      assignedTo: true,
    },
  });

  // KPI Calculations
  const total = leads.length;
  const statusCounts = {
    CONVERTED: 0,
    LIKELY_WARM: 0,
    IN_PROGRESS: 0,
    NEW_LEAD: 0,
    NOT_INTERESTED: 0,
    ON_HOLD: 0,
  };

  leads.forEach(lead => {
    if (statusCounts[lead.status] !== undefined) {
      statusCounts[lead.status]++;
    }
  });

  const converted = statusCounts.CONVERTED;
  const warm = statusCounts.LIKELY_WARM;
  const inProgress = statusCounts.IN_PROGRESS;
  const newLeads = statusCounts.NEW_LEAD;
  const notInterested = statusCounts.NOT_INTERESTED;
  const conversionRate = total ? converted / total : 0;

  // Overdue check
  const overdueCount = leads.filter(lead => isLeadOverdue(lead, todayStr)).length;

  // High priority open check: priority === 'HIGH' and status is not CONVERTED or NOT_INTERESTED
  const closedStatuses = ['CONVERTED', 'NOT_INTERESTED'];
  const highPriorityOpen = leads.filter(lead => 
    lead.priority === 'HIGH' && !closedStatuses.includes(lead.status)
  ).length;

  // Groupings: status, source, owner
  // Helper to compile counts mapped to labels
  const getGroupedCounts = (fieldExtractor) => {
    const countsMap = new Map();
    leads.forEach(lead => {
      const label = fieldExtractor(lead) || 'Unspecified';
      countsMap.set(label, (countsMap.get(label) || 0) + 1);
    });

    return [...countsMap.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };

  const byStatus = getGroupedCounts(lead => lead.status);
  const bySource = getGroupedCounts(lead => lead.source);
  const byProvince = []; // Always empty array in mock
  const byOwner = getGroupedCounts(lead => lead.assignedTo?.name);

  // Due leads: overdue or due today, sorted by nextActionDate ascending, sliced to 10
  // Returns nested assignedTo object
  const dueLeads = leads
    .filter(lead => isLeadOverdue(lead, todayStr))
    .sort((a, b) => {
      const dateA = formatDateString(a.nextActionDate);
      const dateB = formatDateString(b.nextActionDate);
      return dateA.localeCompare(dateB);
    })
    .slice(0, 10)
    .map(lead => ({
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
    }));

  return {
    total,
    converted,
    warm,
    inProgress,
    newLeads,
    notInterested,
    conversionRate,
    overdue: overdueCount,
    highPriorityOpen,
    byStatus,
    bySource,
    byProvince,
    byOwner,
    dueLeads,
  };
}

module.exports = {
  getDashboardOverview,
};
