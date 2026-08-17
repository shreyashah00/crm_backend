const dashboardService = require('../services/dashboardService');
const catchAsync = require('../utils/catchAsync');

const getDashboard = catchAsync(async (req, res) => {
  const overview = await dashboardService.getDashboardOverview(req.user);
  return res.status(200).json(overview); // Frontend expects raw dashboard object directly on GET /dashboard
});

module.exports = {
  getDashboard,
};
