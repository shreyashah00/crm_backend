const notificationService = require('../services/notificationService');
const catchAsync = require('../utils/catchAsync');

const getNotifications = catchAsync(async (req, res) => {
  const notifications = await notificationService.getNotifications(req.user);
  return res.status(200).json(notifications); // Frontend expects the raw array directly on GET /notifications
});

module.exports = {
  getNotifications,
};
