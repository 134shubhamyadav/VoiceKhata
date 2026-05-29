/**
 * validators.js
 * Pure validation functions. Each returns { valid: boolean, message?: string }.
 */

const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian mobile numbers

// ─── Entry ────────────────────────────────────────────────────────────────────

const validateEntry = (body) => {
  const { customerId, customerName, userId, amount, type } = body;

  if (!type || !["credit", "payment", "cashbook_in", "cashbook_out"].includes(type)) {
    return { valid: false, message: 'type must be credit, payment, cashbook_in, or cashbook_out' };
  }

  const isCashbook = type === "cashbook_in" || type === "cashbook_out";

  if (!isCashbook && !customerId && !customerName) {
    return { valid: false, message: "customerId or customerName is required for ledger entries" };
  }

  const parsedAmount = Number(amount);
  if (amount === undefined || amount === null || isNaN(parsedAmount) || parsedAmount <= 0) {
    return { valid: false, message: "amount must be a number greater than 0" };
  }

  return { valid: true };
};

// ─── Customer ─────────────────────────────────────────────────────────────────

const validateCustomer = (body) => {
  const { userId, name, phone } = body;

  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    return { valid: false, message: "userId is required" };
  }

  if (!name || typeof name !== "string" || name.trim() === "") {
    return { valid: false, message: "name is required" };
  }

  if (phone !== undefined && phone !== null && phone !== "") {
    const cleanPhone = String(phone).trim();
    if (cleanPhone.length > 0 && !/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
      return {
        valid: false,
        message: "phone must be a valid mobile number",
      };
    }
  }

  return { valid: true };
};

// ─── Reminder ─────────────────────────────────────────────────────────────────

const validateReminder = (body) => {
  const { customerId, entryId, message } = body;

  if (!customerId || typeof customerId !== "string" || customerId.trim() === "") {
    return { valid: false, message: "customerId is required" };
  }

  if (!message && (!entryId || typeof entryId !== "string" || entryId.trim() === "")) {
    return { valid: false, message: "entryId is required when no custom message is provided" };
  }

  return { valid: true };
};

// ─── Registry ─────────────────────────────────────────────────────────────────

const validators = {
  entry: validateEntry,
  customer: validateCustomer,
  reminder: validateReminder,
};

module.exports = { validators };
