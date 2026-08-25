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

const updateActivity = catchAsync(async (req, res) => {
  const activityId = parseInt(req.params.id);
  const updated = await activityService.updateActivity(activityId, req.body, req.user);
  return res.status(200).json(updated);
});

const deleteActivity = catchAsync(async (req, res) => {
  const activityId = parseInt(req.params.id);
  const result = await activityService.deleteActivity(activityId, req.user);
  return res.status(200).json(result);
});

module.exports = {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
};
