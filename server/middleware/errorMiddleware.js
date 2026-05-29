/**
 * errorMiddleware.js
 * Global Express error handler — must be registered LAST via app.use(errorMiddleware).
 * Catches all errors forwarded by next(err) and normalises them into the
 * project's standard response envelope.
 */

// ─── Error classifiers ────────────────────────────────────────────────────────

const isMongooseValidationError = (err) =>
  err.name === "ValidationError" && err.errors !== undefined;

const isMongooseCastError = (err) => err.name === "CastError";

const isMongooseDuplicateKeyError = (err) =>
  err.name === "MongoServerError" && err.code === 11000;

const isMongooseDocumentNotFound = (err) => err.name === "DocumentNotFoundError";

// ─── Message builders ─────────────────────────────────────────────────────────

const buildValidationMessage = (err) => {
  const fields = Object.values(err.errors)
    .map((e) => e.message)
    .join("; ");
  return `Validation failed: ${fields}`;
};

const buildCastMessage = (err) =>
  `Invalid value for field "${err.path}": "${err.value}"`;

const buildDuplicateKeyMessage = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || "field";
  return `Duplicate value for ${field}`;
};

// ─── Middleware ───────────────────────────────────────────────────────────────

const errorMiddleware = (err, req, res, next) => {
  // Log full error server-side for observability
  console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err);

  // 1. Mongoose field-level validation error
  if (isMongooseValidationError(err)) {
    return res.status(400).json({
      success: false,
      message: buildValidationMessage(err),
    });
  }

  // 2. Bad ObjectId / type mismatch
  if (isMongooseCastError(err)) {
    return res.status(400).json({
      success: false,
      message: buildCastMessage(err),
    });
  }

  // 3. Unique index violation
  if (isMongooseDuplicateKeyError(err)) {
    return res.status(409).json({
      success: false,
      message: buildDuplicateKeyMessage(err),
    });
  }

  // 4. Document not found
  if (isMongooseDocumentNotFound(err)) {
    return res.status(404).json({
      success: false,
      message: "Resource not found",
    });
  }

  // 5. Operational errors thrown manually
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
    });
  }

  // 6. Unknown / unexpected errors — hide internal details in production
  const isProd = process.env.NODE_ENV === "production";
  return res.status(500).json({
    success: false,
    message: isProd ? "An unexpected error occurred" : err.message,
  });
};

// ─── Helper: create an operational error ─────────────────────────────────────

/**
 * createError(message, statusCode)
 * Produces a pre-tagged operational error that errorMiddleware will
 * handle cleanly without leaking stack traces.
 */
const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.isOperational = true;
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorMiddleware, createError };
