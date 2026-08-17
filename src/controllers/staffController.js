const staffService = require('../services/staffService');
const catchAsync = require('../utils/catchAsync');

const getLeaderboard = catchAsync(async (req, res) => {
  const leaderboard = await staffService.getLeaderboard();
  return res.status(200).json(leaderboard); // Frontend expects the raw array directly on GET /staff/leaderboard
});

const getStaffWorkspace = catchAsync(async (req, res) => {
  // Uses the currently authenticated user id
  const workspace = await staffService.getStaffWorkspace(req.user.id);
  return res.status(200).json(workspace); // Frontend expects raw object directly on GET /staff/me/work
});

const getStaffPerformance = catchAsync(async (req, res) => {
  const staffId = parseInt(req.params.id);
  const performance = await staffService.getStaffPerformance(staffId);
  return res.status(200).json(performance); // Frontend expects raw object directly on GET /staff/:id/performance
});

const saveTarget = catchAsync(async (req, res) => {
  const staffId = parseInt(req.params.id);
  const target = await staffService.saveTarget(staffId, req.body);
  return res.status(200).json(target); // Frontend expects raw object directly on PUT /staff/:id/target
});

module.exports = {
  getLeaderboard,
  getStaffWorkspace,
  getStaffPerformance,
  saveTarget,
};
