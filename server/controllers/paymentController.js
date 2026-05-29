"use strict";

const entryController = require("./entryController");

/**
 * paymentController.js
 * Adaptor wrapper that forwards queries to entryController.js's makePayment.
 * This completely eliminates duplicate business logic and ensures one source of truth.
 */
const makePayment = (req, res, next) => {
  // Normalize params and body to be compatible with entryController
  req.params.id = req.params.entryId;
  req.body.paidAmount = req.body.amountPaid ?? req.body.paidAmount;
  
  return entryController.makePayment(req, res, next);
};

module.exports = { makePayment };
