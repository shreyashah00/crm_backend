const { prisma } = require('../lib/prisma');
const { formatDateString } = require('./leadService');

/**
 * Gets calendar activities and scheduled follow-ups for a date range
 */
async function getCalendarEvents({ startDate, endDate, staffId, user }) {
  const isSales = user && user.role === 'SALES';
  const targetStaffId = staffId ? parseInt(staffId) : (isSales ? user.id : null);

  const leadsFilter = targetStaffId ? { assignedToId: targetStaffId } : {};

  // Fetch leads with assigned staff and activities
  const leads = await prisma.lead.findMany({
    where: leadsFilter,
    include: {
      assignedTo: true,
      activities: {
        include: { createdBy: true },
        orderBy: { occurredAt: 'desc' },
      },
    },
  });

  const events = [];
  const closedStatuses = ['CONVERTED', 'NOT_INTERESTED'];

  leads.forEach((lead) => {
    // 1. Next Action Date / Scheduled Follow-up Event
    const nextAction = formatDateString(lead.nextActionDate);
    if (nextAction) {
      if ((!startDate || nextAction >= startDate) && (!endDate || nextAction <= endDate)) {
        events.push({
          id: `lead-action-${lead.id}`,
          leadId: lead.id,
          title: `${lead.organizationName} - Next Action`,
          type: 'FOLLOW_UP',
          scheduledAt: nextAction,
          occurredAt: nextAction,
          status: closedStatuses.includes(lead.status) ? 'COMPLETED' : 'PENDING',
          organizationName: lead.organizationName,
          contactName: lead.contactName,
          phone: lead.phone,
          email: lead.email,
          priority: lead.priority,
          leadStatus: lead.status,
          assignedTo: lead.assignedTo ? {
            id: lead.assignedTo.id,
            name: lead.assignedTo.name,
            email: lead.assignedTo.email,
            role: lead.assignedTo.role,
          } : null,
        });
      }
    }

    // 2. Logged Activities Events
    (lead.activities || []).forEach((act) => {
      const actDate = formatDateString(act.occurredAt);
      if (actDate) {
        if ((!startDate || actDate >= startDate) && (!endDate || actDate <= endDate)) {
          events.push({
            id: `activity-${act.id}`,
            leadId: lead.id,
            title: `${lead.organizationName} - ${act.type}`,
            type: act.type,
            occurredAt: actDate,
            scheduledAt: actDate,
            status: 'COMPLETED',
            remarks: act.remarks,
            organizationName: lead.organizationName,
            contactName: lead.contactName,
            phone: lead.phone,
            email: lead.email,
            priority: lead.priority,
            leadStatus: lead.status,
            createdBy: {
              id: act.createdBy.id,
              name: act.createdBy.name,
              email: act.createdBy.email,
            },
            assignedTo: lead.assignedTo ? {
              id: lead.assignedTo.id,
              name: lead.assignedTo.name,
            } : null,
          });
        }
      }
    });
  });

  // Sort events by date ascending
  return events.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

module.exports = {
  getCalendarEvents,
};
