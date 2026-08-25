const activityService = require('../services/activityService');
const catchAsync = require('../utils/catchAsync');

const getActivities = catchAsync(async (req, res) => {
  const result = await activityService.getActivities(req.query);
  return res.status(200).json(result);
});

const createActivity = catchAsync(async (req, res) => {
  const activity = await activityService.createActivity(req.body, req.user);
  return res.status(201).json(activity);
});

module.exports = {
  getActivities,
  createActivity,
};
