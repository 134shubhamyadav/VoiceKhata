const Customer = require("../models/Customer");
const Entry = require("../models/Entry");
const { calculateDelay } = require("../utils/calculateDelay");

/**
 * Fetch full customer profile with stats and recent transactions.
 * @param {string} customerId
 * @returns {{ customer, stats, recentTransactions }}
 */
const getCustomerDetails = async (customerId) => {
  const customer = await Customer.findById(customerId).lean();
  if (!customer) return null;

  const entries = await Entry.find({ customerId }).sort({ createdAt: -1 }).lean();

  const credits = entries.filter((e) => e.type === "credit");
  const payments = entries.filter((e) => e.type === "payment");

  const totalTaken = credits.reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = payments.reduce((sum, e) => sum + e.amount, 0);

  // avgDelay: average delay across paid/partial credit entries that have a dueDate
  const delayedEntries = credits.filter(
    (e) => (e.status === "paid" || e.status === "partial") && e.dueDate
  );

  let avgDelay = 0;
  if (delayedEntries.length > 0) {
    const totalDelay = delayedEntries.reduce((sum, e) => {
      const paymentDate = e.updatedAt || new Date();
      return sum + calculateDelay({ dueDate: e.dueDate, paymentDate });
    }, 0);
    avgDelay = Math.round(totalDelay / delayedEntries.length);
  }

  const recentTransactions = entries.slice(0, 10);

  return {
    customer,
    stats: {
      totalTaken,
      totalPaid,
      avgDelay,
    },
    recentTransactions,
  };
};

module.exports = { getCustomerDetails };
