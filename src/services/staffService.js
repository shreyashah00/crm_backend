const { prisma } = require('../lib/prisma');
const ApiError = require('../utils/ApiError');
const { formatDateString } = require('./leadService');

/**
 * Checks if a lead's follow-up is overdue or due today
 * @param {object} lead - Lead object
 * @param {string} todayStr - Today formatted as YYYY-MM-DD
 */
function isLeadOverdue(lead, todayStr) {
  const nextAction = formatDateString(lead.nextActionDate);
  if (!nextAction) return false;

  const closedStatuses = ['CONVERTED', 'NOT_INTERESTED'];
  return nextAction <= todayStr && !closedStatuses.includes(lead.status);
}

/**
 * Computes performance statistics for a staff member (corresponds to function u in frontend)
 * @param {object} user - User record
 * @param {string} todayStr - Current date YYYY-MM-DD
 */
async function computeStaffPerformance(user, todayStr = formatDateString(new Date())) {
  // 1. Fetch leads assigned to the user
  const assignedLeads = await prisma.lead.findMany({
    where: { assignedToId: user.id },
    include: {
      activities: {
        where: { createdById: user.id }
      }
    }
  });

  // 2. Fetch targets for this user
  const target = await prisma.target.findUnique({
    where: { staffId: user.id }
  });

  const currentMonthPrefix = todayStr.slice(0, 7); // e.g. "2026-08"

  // KPI math
  const l = assignedLeads.filter(lead => lead.status === 'CONVERTED').length; // converted leads total
  const c = assignedLeads.filter(lead => formatDateString(lead.dateAdded)?.startsWith(currentMonthPrefix)).length; // leads assigned & added this month

  // Extract all activities logged by this user on their assigned leads
  const activities = assignedLeads.flatMap(lead => lead.activities);
  const o = activities.filter(act => formatDateString(act.occurredAt)?.startsWith(currentMonthPrefix)).length; // follow-ups this month
  const d = activities.filter(act => 
    formatDateString(act.occurredAt)?.startsWith(currentMonthPrefix) &&
    ['PHYSICAL_MEETING', 'ONLINE_MEETING'].includes(act.type)
  ).length; // meetings this month

  const u = assignedLeads.length ? l / assignedLeads.length : 0; // conversion rate
  const overdueCount = assignedLeads.filter(lead => isLeadOverdue(lead, todayStr)).length;
  const warmCount = assignedLeads.filter(lead => lead.status === 'LIKELY_WARM').length;

  // Performance score (m)
  let score = 0;
  if (target) {
    const leadRatio = c / Math.max(1, target.leadTarget);
    const followUpRatio = o / Math.max(1, target.followUpTarget);
    const meetingRatio = d / Math.max(1, target.meetingTarget);
    const conversionRatio = l / Math.max(1, target.conversionTarget);

    const sum = [leadRatio, followUpRatio, meetingRatio, conversionRatio].reduce(
      (acc, ratio) => acc + Math.min(1.25, ratio),
      0
    );

    score = Math.round((sum / 4) * 1000) / 10;
  } else {
    score = Math.round((30 * l + 5 * d + o + 100 * u) * 10) / 10;
  }

  // Format targets to match frontend expectations
  const targetPayload = target ? {
    staffId: target.staffId,
    leadTarget: target.leadTarget,
    followUpTarget: target.followUpTarget,
    meetingTarget: target.meetingTarget,
    conversionTarget: target.conversionTarget,
    revenueTarget: target.revenueTarget,
  } : null;

  return {
    staff: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      designation: user.designation,
    },
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    assigned: assignedLeads.length,
    leadsAdded: c,
    followUps: o,
    meetings: d,
    converted: l,
    warm: warmCount,
    overdue: overdueCount,
    conversionRate: u,
    target: targetPayload,
    score: score,
  };
}

/**
 * Gets leaderboard ranking for all active non-ADMIN staff
 */
async function getLeaderboard() {
  const staffUsers = await prisma.user.findMany({
    where: {
      active: true,
      role: { not: 'ADMIN' },
    },
  });

  const todayStr = formatDateString(new Date());
  const performances = [];

  for (const user of staffUsers) {
    const perf = await computeStaffPerformance(user, todayStr);
    performances.push(perf);
  }

  // Sort by score descending
  return performances.sort((a, b) => b.score - a.score);
}

/**
 * Gets workspace overview data for a logged-in user (My Work)
 */
async function getStaffWorkspace(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const todayStr = formatDateString(new Date());

  // Compute monthly performance
  const performance = await computeStaffPerformance(user, todayStr);

  // Get due and overdue leads assigned to this user
  const dueLeads = await prisma.lead.findMany({
    where: {
      assignedToId: userId,
    },
    include: {
      assignedTo: true,
      activities: {
        include: { createdBy: true },
      },
    },
  });

  // Filter and sort due/overdue leads:
  // Must have a nextActionDate and be overdue or due today (nextActionDate <= todayStr)
  // Excludes closed statuses (CONVERTED, NOT_INTERESTED, ON_HOLD)
  // Wait, let's verify if ON_HOLD is excluded in dueLeads list.
  // In frontend mock:
  // const closedForDue = new Set(["CONVERTED", "NOT_INTERESTED"]);
  // Wait, in function h(e): "function h(e){return!!e.nextActionDate&&e.nextActionDate<=n()&&!o.has(String(e.status))}"
  // And o = new Set(["CONVERTED", "NOT_INTERESTED"]);
  // So yes! ONLY "CONVERTED" and "NOT_INTERESTED" are excluded! "ON_HOLD" is included in due check!
  // Let's implement it:
  const overdueLeads = dueLeads
    .filter(lead => isLeadOverdue(lead, todayStr))
    .map(lead => {
      // Map to exact frontend shape
      return {
        id: lead.id,
        organizationName: lead.organizationName,
        contactName: lead.contactName,
        phone: lead.phone,
        email: lead.email,
        status: lead.status,
        priority: lead.priority,
        nextActionDate: formatDateString(lead.nextActionDate),
      };
    })
    .sort((a, b) => a.nextActionDate.localeCompare(b.nextActionDate))
    .slice(0, 20); // show top 20

  return {
    performance,
    dueLeads: overdueLeads,
  };
}

/**
 * Gets performance details for a staff member by ID
 */
async function getStaffPerformance(staffId) {
  const user = await prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!user) {
    throw ApiError.notFound('Staff member not found');
  }

  return computeStaffPerformance(user);
}

/**
 * Updates staff targets
 */
async function saveTarget(staffId, data) {
  const user = await prisma.user.findUnique({
    where: { id: staffId },
  });

  if (!user) {
    throw ApiError.notFound('Staff member not found');
  }

  const updatedTarget = await prisma.target.upsert({
    where: { staffId },
    update: {
      leadTarget: data.leadTarget,
      followUpTarget: data.followUpTarget,
      meetingTarget: data.meetingTarget,
      conversionTarget: data.conversionTarget,
      revenueTarget: data.revenueTarget || 0,
    },
    create: {
      staffId,
      leadTarget: data.leadTarget,
      followUpTarget: data.followUpTarget,
      meetingTarget: data.meetingTarget,
      conversionTarget: data.conversionTarget,
      revenueTarget: data.revenueTarget || 0,
    },
  });

  return {
    staffId: updatedTarget.staffId,
    leadTarget: updatedTarget.leadTarget,
    followUpTarget: updatedTarget.followUpTarget,
    meetingTarget: updatedTarget.meetingTarget,
    conversionTarget: updatedTarget.conversionTarget,
    revenueTarget: updatedTarget.revenueTarget,
  };
}

module.exports = {
  getLeaderboard,
  getStaffWorkspace,
  getStaffPerformance,
  saveTarget,
  isLeadOverdue,
};
