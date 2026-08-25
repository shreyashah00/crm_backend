const calendarService = require('../services/calendarService');
const catchAsync = require('../utils/catchAsync');

const getCalendarEvents = catchAsync(async (req, res) => {
  const { startDate, endDate, staffId } = req.query;
  const events = await calendarService.getCalendarEvents({
    startDate,
    endDate,
    staffId,
    user: req.user,
  });

  return res.status(200).json(events);
});

module.exports = {
  getCalendarEvents,
};
