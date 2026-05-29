/**
 * validate.js
 *
 * Lightweight validation helpers used by controllers.
 * All functions throw on failure — handleError() in response.js
 * will classify and format the error for the client.
 */

const mongoose = require("mongoose");

// ---------------------------------------------------------------------------
// requireFields
// ---------------------------------------------------------------------------

/**
 * Assert that all required fields are present and non-empty in a body object.
 *
 * @param {object}   body    - req.body or any plain object
 * @param {string[]} fields  - Required key names
 * @throws if any field is missing / null / empty string
 */
const requireFields = (body, fields) => {
  const missing = fields.filter(
    (f) => body[f] === undefined || body[f] === null || body[f] === ""
  );
  if (missing.length > 0) {
    throw Object.assign(
      new Error(`Missing required field(s): ${missing.join(", ")}`),
      { status: 400 }
    );
  }
};

// ---------------------------------------------------------------------------
// requireObjectId
// ---------------------------------------------------------------------------

/**
 * Assert that a value is a valid Mongoose ObjectId.
 *
 * @param {string} value  - Value to test
 * @param {string} label  - Field name shown in the error
 * @throws CastError-style error if invalid
 */
const requireObjectId = (value, label = "id") => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const err = new Error(`Invalid ID format: ${value}`);
    err.name  = "CastError";
    err.value = value;
    err.path  = label;
    throw err;
  }
};

// ---------------------------------------------------------------------------
// requirePositiveNumber
// ---------------------------------------------------------------------------

/**
 * Parse and assert a value is a positive finite number.
 *
 * @param {*}      value  - Value to test (string or number)
 * @param {string} label  - Field name shown in the error
 * @returns {number}       Parsed float
 * @throws if NaN or ≤ 0
 */
const requirePositiveNumber = (value, label = "amount") => {
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) {
    throw new Error(`${label} must be a positive number`);
  }
  return n;
};

module.exports = { requireFields, requireObjectId, requirePositiveNumber };
