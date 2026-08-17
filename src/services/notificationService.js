const { prisma } = require('../lib/prisma');
const { formatDateString } = require('./leadService');

/**
 * Generates follow-up and stale alerts for the user
 * @param {object} user - Authenticated user object
 */
async function getNotifications(user) {
  const todayStr = formatDateString(new Date());

  // Filter leads based on role
  const isSales = user.role === 'SALES';
  const leadsFilter = isSales ? { assignedToId: user.id } : {};

  const leads = await prisma.lead.findMany({
    where: leadsFilter,
    include: {
      activities: {
        orderBy: { occurredAt: 'desc' },
      },
    },
  });

  const closedStatuses = ['CONVERTED', 'NOT_INTERESTED'];
  const notifications = [];

  leads.forEach((lead) => {
    // Skip if status is closed
    if (closedStatuses.includes(lead.status)) return;

    // Find the latest activity date or fallback to lead added date or today
    let latestActivityDateStr = formatDateString(lead.dateAdded) || todayStr;
    if (lead.activities && lead.activities.length > 0) {
      latestActivityDateStr = formatDateString(lead.activities[0].occurredAt);
    }

    const nextActionStr = formatDateString(lead.nextActionDate);

    // 1. Follow-up Overdue
    if (nextActionStr && nextActionStr < todayStr) {
      notifications.push({
        id: `overdue-${lead.id}`,
        leadId: lead.id,
        kind: 'OVERDUE',
        title: 'Follow-up overdue',
        detail: lead.organizationName,
        date: nextActionStr,
        priority: 'HIGH',
      });
      return;
    }

    // 2. Follow-up Due Today
    if (nextActionStr && nextActionStr === todayStr) {
      notifications.push({
        id: `today-${lead.id}`,
        leadId: lead.id,
        kind: 'DUE_TODAY',
        title: 'Follow-up due today',
        detail: lead.organizationName,
        date: todayStr,
        priority: 'HIGH',
      });
      return;
    }

    // 3. Stale Lead (No activity for >= 7 days and no nextActionDate scheduled)
    if (!nextActionStr) {
      const todayMs = Date.parse(todayStr);
      const latestMs = Date.parse(latestActivityDateStr);
      const diffDays = latestMs ? Math.floor((todayMs - latestMs) / 864e5) : 999;

      if (diffDays >= 7) {
        notifications.push({
          id: `stale-${lead.id}`,
          leadId: lead.id,
          kind: 'STALE',
          title: 'Lead needs attention',
          detail: `${lead.organizationName} · ${diffDays === 999 ? 'No activity' : `${diffDays} days inactive`}`,
          date: latestActivityDateStr,
          priority: lead.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        });
      }
    }
  });

  // Sort: Overdue first, then by date ascending
  return notifications
    .sort((a, b) => {
      const kindSort = (a.kind === 'OVERDUE' ? -1 : 1) - (b.kind === 'OVERDUE' ? -1 : 1);
      if (kindSort !== 0) return kindSort;
      return a.date.localeCompare(b.date);
    })
    .slice(0, 40);
}

module.exports = {
  getNotifications,
};
