/**
 * response.js
 *
 * Canonical response helpers used by every controller.
 * Guarantees consistent shape:
 *
 *   SUCCESS:  { success: true,  data: {}       }
 *   ERROR:    { success: false, message: "..." }
 *
 * Also strips internal Mongoose fields (__v) from any document/array.
 */

const STRIP_FIELDS = ["__v"];

// ---------------------------------------------------------------------------
// sanitise — recursive field stripper
// ---------------------------------------------------------------------------

/**
 * Recursively clean a value:
 *   Mongoose doc  → toObject({ versionKey: false }), then strip STRIP_FIELDS
 *   Plain object  → strip STRIP_FIELDS
 *   Array         → map each element
 *   Primitive     → return as-is
 */
const sanitise = (value) => {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) return value.map(sanitise);

  if (typeof value.toObject === "function") {
    return sanitise(value.toObject({ versionKey: false }));
  }

  if (value !== null && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !STRIP_FIELDS.includes(key))
        .map(([key, val]) => [key, sanitise(val)])
    );
  }

  return value;
};

// ---------------------------------------------------------------------------
// sendSuccess
// ---------------------------------------------------------------------------

/**
 * @param {object} res      - Express response
 * @param {*}      data     - Payload (doc, array, plain object)
 * @param {number} [status] - HTTP status (default 200)
 */
const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data: sanitise(data) });

// ---------------------------------------------------------------------------
// sendError
// ---------------------------------------------------------------------------

/**
 * @param {object} res      - Express response
 * @param {string} message  - Human-readable error
 * @param {number} [status] - HTTP status (default 400)
 */
const sendError = (res, message, status = 400) =>
  res.status(status).json({
    success: false,
    message: String(message || "Something went wrong"),
  });

// ---------------------------------------------------------------------------
// handleError  — classifies common error types into the right HTTP code
// ---------------------------------------------------------------------------

/**
 * Central catch handler.  Pass err + res and it picks the right status/message.
 *
 * Covers:
 *   - Mongoose ValidationError   → 422
 *   - Mongoose CastError (bad ID)→ 400
 *   - Mongo duplicate key 11000  → 409
 *   - MongoNetworkError          → 503
 *   - Business-logic messages    → 404 / 409 / 422 via keyword match
 *   - Everything else            → 500
 */
const handleError = (err, res) => {
  console.error(`[VoiceKhata] ${err.name || "Error"}: ${err.message}`);

  // Mongoose schema validation
  if (err.name === "ValidationError") {
    const msg = Object.values(err.errors).map((e) => e.message).join(", ");
    return sendError(res, msg, 422);
  }

  // Bad ObjectId cast
  if (err.name === "CastError") {
    return sendError(res, `Invalid ID format: ${err.value}`, 400);
  }

  // Duplicate key
  if (err.code === 11000) {
    return sendError(res, "Duplicate entry — record already exists", 409);
  }

  // DB connectivity
  if (
    err.name === "MongoNetworkError" ||
    err.name === "MongoServerSelectionError"
  ) {
    return sendError(res, "Database unavailable. Please try again shortly.", 503);
  }

  // Business-logic keyword matching
  if (err.message?.includes("not found"))           return sendError(res, err.message, 404);
  if (err.message?.includes("already fully paid"))  return sendError(res, err.message, 409);
  if (err.message?.includes("already sent"))        return sendError(res, err.message, 409);
  if (err.message?.includes("exceeds"))             return sendError(res, err.message, 422);
  if (err.message?.includes("must be a positive"))  return sendError(res, err.message, 422);

  return sendError(res, err.message || "Internal server error", 500);
};

module.exports = { sendSuccess, sendError, handleError, sanitise };
