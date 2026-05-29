/**
 * errorHandler.js
 *
 * Express global error-handling middleware.
 * Catches anything thrown outside of a try-catch in controllers,
 * including errors from middleware earlier in the chain.
 *
 * Must be registered LAST in server.js (after all routes).
 */

const { sendError } = require("../utils/response");

// Malformed JSON body from express.json()
const jsonSyntaxHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return sendError(res, "Invalid JSON in request body", 400);
  }
  next(err);
};

// Final fallback — catches anything not handled upstream
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  console.error("[Unhandled Error]", err);
  sendError(res, "Internal server error", 500);
};

module.exports = { jsonSyntaxHandler, globalErrorHandler };
