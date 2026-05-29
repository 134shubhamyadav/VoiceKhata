const { validators } = require("./validators");

/**
 * validateRequest(schema)
 * Factory that returns an Express middleware which validates req.body
 * against the named schema in validators.js.
 *
 * Usage:
 *   router.post("/entries", validateRequest("entry"), createEntry);
 *
 * @param {"entry"|"customer"|"reminder"} schema
 */
const validateRequest = (schema) => (req, res, next) => {
  const validate = validators[schema];

  if (!validate) {
    return res
      .status(500)
      .json({ success: false, message: `No validator defined for schema: "${schema}"` });
  }

  const { valid, message } = validate(req.body);

  if (!valid) {
    return res.status(400).json({ success: false, message: message || "Invalid input" });
  }

  next();
};

module.exports = { validateRequest };
