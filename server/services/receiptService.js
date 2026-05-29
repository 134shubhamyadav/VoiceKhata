const SHOP_NAME = process.env.SHOP_NAME || "VoiceKhata Shop";

// ---------------------------------------------------------------------------
// generateReceipt
// ---------------------------------------------------------------------------

/**
 * Build a receipt data object from an entry + customer.
 * Pure function — no DB writes. Caller decides what to do with the result.
 *
 * @param {object} entry    - Entry document (populated or plain)
 * @param {object} customer - Customer document
 * @returns {object}        Receipt payload
 */
const { t } = require("../i18n");

/**
 * Build a receipt data object from an entry + customer.
 * Pure function — no DB writes. Caller decides what to do with the result.
 *
 * @param {object} entry    - Entry document (populated or plain)
 * @param {object} customer - Customer document
 * @returns {object}        Receipt payload
 */
const generateReceipt = (entry, customer) => {
  if (!entry)    throw new Error("Entry is required to generate a receipt");
  if (!customer) throw new Error("Customer is required to generate a receipt");

  // Generates a clean 6-character upper-case alphanumeric suffix without external dependencies
  const receiptId = `RCP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const date = new Date(entry.updatedAt || entry.createdAt || Date.now());

  const formattedDate = date.toLocaleDateString("en-IN", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-IN", {
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const lang = customer.userId && customer.userId.language ? customer.userId.language : 'en';

  return {
    receiptId,
    shopName:     customer.userId && customer.userId.shopName ? customer.userId.shopName : SHOP_NAME,
    customerName: customer.name,
    customerPhone: customer.phone || null,
    entryId:      String(entry._id),
    amount:       entry.amount,
    paidAmount:   entry.type === "payment" ? entry.amount : entry.amount - entry.remainingAmount,
    remainingAmount: entry.remainingAmount ?? 0,
    type:         entry.type,       // "credit" | "payment"
    status:       entry.status,     // "pending" | "partial" | "paid"
    translatedType: t(lang, `receipt.typeLabels.${entry.type}`),
    translatedStatus: t(lang, `receipt.statusLabels.${entry.status}`),
    title:        t(lang, "receipt.title"),
    date:         formattedDate,
    time:         formattedTime,
    issuedAt:     date.toISOString(),
  };
};

module.exports = { generateReceipt };
