/**
 * Wraps an asynchronous middleware/route handler to catch errors and pass them to the express error handler
 * @param {Function} fn - Async middleware function
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
