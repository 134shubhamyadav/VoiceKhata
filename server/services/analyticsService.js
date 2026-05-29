const Entry = require("../models/Entry");

/**
 * Compute per-customer analytics from their entry history.
 * All calculations are derived from Entry documents — no stale cached fields used.
 */
const getCustomerStats = async (customerId) => {
  const entries = await Entry.find({ customerId }).sort({ createdAt: 1 }).lean();

  if (!entries.length) {
    return {
      totalTaken: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      avgDelayDays: 0,
      lastPaymentDate: null,
      transactionCount: 0,
    };
  }

  const creditEntries = entries.filter((e) => e.type === "credit");
  const paymentEntries = entries.filter((e) => e.type === "payment");

  // Total credit issued
  const totalTaken = creditEntries.reduce((sum, e) => sum + e.amount, 0);

  // Total actually paid back
  const totalPaid = paymentEntries.reduce((sum, e) => sum + e.amount, 0);

  // Outstanding = sum of remainingAmount on open credit entries
  const totalOutstanding = creditEntries.reduce((sum, e) => {
    if (e.status === "paid") return sum;
    const remaining = e.remainingAmount ?? e.amount;
    return sum + remaining;
  }, 0);

  // Average delay: for each paid/partial credit entry that has a dueDate,
  // find linked payment entries and measure the gap from dueDate → first payment date
  const delayDays = [];
  for (const credit of creditEntries) {
    if (!credit.dueDate) continue;

    const linkedPayments = paymentEntries
      .filter((p) => String(p.linkedEntryId) === String(credit._id))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (!linkedPayments.length) continue;

    const firstPaymentDate = new Date(linkedPayments[0].createdAt);
    const due = new Date(credit.dueDate);
    const diff = Math.floor((firstPaymentDate - due) / (1000 * 60 * 60 * 24));
    delayDays.push(diff); // negative = paid early, positive = paid late
  }

  const avgDelayDays =
    delayDays.length > 0
      ? parseFloat((delayDays.reduce((s, d) => s + d, 0) / delayDays.length).toFixed(2))
      : 0;

  // Most recent payment date
  const lastPaymentDate =
    paymentEntries.length > 0
      ? paymentEntries.reduce((latest, p) => {
          const d = new Date(p.createdAt);
          return d > latest ? d : latest;
        }, new Date(0))
      : null;

  return {
    totalTaken: parseFloat(totalTaken.toFixed(2)),
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
    avgDelayDays,
    lastPaymentDate,
    transactionCount: entries.length,
  };
};

module.exports = { getCustomerStats };
