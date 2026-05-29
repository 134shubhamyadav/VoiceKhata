// Wraps async route handlers so unhandled promise rejections
// are forwarded to the global error handler automatically.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
