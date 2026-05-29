/**
 * demoGuard.js
 *
 * Demo-mode utilities used by controllers and services.
 *
 * Three levels of demo safety:
 *
 *   1. demoFallback(err, res, stub)
 *      — catch-block handler: swallows soft business errors, surfaces hard ones
 *
 *   2. demoAutoFill(data, defaults)
 *      — fills missing fields automatically so the system never stalls
 *
 *   3. demoEnsureCustomer(nameOrId)
 *      — if customer not found by ID → creates one on the fly
 *      — prevents "Customer not found" from ever crashing a demo
 */

"use strict";

const appConfig       = require("../config/appConfig");
const { sendSuccess } = require("../utils/response");

// ---------------------------------------------------------------------------
// isDemoMode
// ---------------------------------------------------------------------------
const isDemoMode = () => appConfig.demoMode;

// ---------------------------------------------------------------------------
// Soft-error patterns — swallowed in demo mode
// Hard errors (DB down, programming bugs) still surface
// ---------------------------------------------------------------------------
const SOFT_ERROR_PATTERNS = [
  "already sent",
  "already fully paid",
  "not found",
  "exceeds remaining balance",
  "cannot be empty",
  "invalid scenario",
];

const isSoftError = (message = "") =>
  SOFT_ERROR_PATTERNS.some((p) => message.toLowerCase().includes(p.toLowerCase()));

// ---------------------------------------------------------------------------
// demoFallback
//
// Usage in any catch block:
//   if (demoFallback(err, res, stubData)) return;
//   return handleError(err, res);
//
// Returns true  → response already sent, caller should return
// Returns false → caller should handle normally
// ---------------------------------------------------------------------------

/**
 * @param {Error}  err
 * @param {object} res      - Express response object
 * @param {object} stubData - Payload to return when error is suppressed
 * @returns {boolean}
 */
const demoFallback = (err, res, stubData = {}) => {
  if (!isDemoMode()) return false;

  if (isSoftError(err.message)) {
    console.warn(`[DEMO] Suppressed: "${err.message}"`);
    sendSuccess(res, { demo: true, suppressed: err.message, ...stubData });
    return true;
  }

  return false;   // hard error — let handleError deal with it
};

// ---------------------------------------------------------------------------
// demoAutoFill
//
// Fills any null/undefined fields in `data` from `defaults`.
// Only active in demo mode — in production, returns data unchanged.
//
// Usage:
//   const safe = demoAutoFill(parsedVoice, {
//     amount:    500,
//     dueDate:   new Date(),
//     type:      "credit",
//   });
// ---------------------------------------------------------------------------

/**
 * @param {object} data      - Object that may have missing fields
 * @param {object} defaults  - Fallback values for each key
 * @returns {object}          Merged object (original in production)
 */
const demoAutoFill = (data, defaults = {}) => {
  if (!isDemoMode()) return data;

  const filled = { ...data };
  for (const [key, fallback] of Object.entries(defaults)) {
    if (filled[key] === null || filled[key] === undefined || filled[key] === "") {
      console.warn(`[DEMO] Auto-filled missing field "${key}" with: ${JSON.stringify(fallback)}`);
      filled[key] = fallback;
    }
  }
  return filled;
};

// ---------------------------------------------------------------------------
// demoEnsureCustomer
//
// Looks up a customer by ID.  If not found AND demoMode is on, creates one.
// This prevents "Customer not found" from ever killing a demo flow.
//
// Usage:
//   const customer = await demoEnsureCustomer(customerId, "Fallback Name");
// ---------------------------------------------------------------------------

/**
 * @param {string} customerId
 * @param {string} [fallbackName]
 * @returns {Promise<CustomerDocument>}
 */
const demoEnsureCustomer = async (customerId, fallbackName = "Demo Customer") => {
  // Lazy require to avoid circular dependency at module load time
  const Customer = require("../models/Customer");
  const mongoose = require("mongoose");

  // If ID is invalid ObjectId, create fresh in demo mode
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    if (isDemoMode()) {
      console.warn(`[DEMO] Invalid customerId "${customerId}" — creating new customer`);
      return Customer.create({ name: fallbackName, phone: null });
    }
    const err  = new Error(`Invalid ID format: ${customerId}`);
    err.name   = "CastError";
    err.value  = customerId;
    throw err;
  }

  const existing = await Customer.findById(customerId);

  if (existing) return existing;

  if (isDemoMode()) {
    console.warn(`[DEMO] Customer ${customerId} not found — creating "${fallbackName}"`);
    return Customer.create({ name: fallbackName, phone: null });
  }

  throw new Error(`Customer not found: ${customerId}`);
};

module.exports = { isDemoMode, demoFallback, demoAutoFill, demoEnsureCustomer, isSoftError };
