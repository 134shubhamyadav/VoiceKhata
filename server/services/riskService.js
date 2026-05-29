const Customer = require("../models/Customer");
const Entry = require("../models/Entry");
const { getCustomerStats } = require("./analyticsService");

/**
 * Risk thresholds — centralised so they're easy to tune.
 */
const THRESHOLDS = {
  HIGH_DELAY_DAYS: 10,
  MEDIUM_DELAY_DAYS: 3,
  HIGH_OUTSTANDING: 500000, // outstanding thresholds are in paise (5000 * 100)
  LATE_PAYMENT_WEIGHT: 5,
};

/**
 * Rule-based risk label derived from stats.
 * Returns "low" | "medium" | "high"
 */
const deriveRiskLabel = (stats, latePaymentsCount) => {
  const { avgDelayDays, totalOutstanding } = stats;

  if (avgDelayDays > THRESHOLDS.HIGH_DELAY_DAYS || totalOutstanding > THRESHOLDS.HIGH_OUTSTANDING) {
    return "high";
  }

  if (avgDelayDays > THRESHOLDS.MEDIUM_DELAY_DAYS) {
    return "medium";
  }

  // Penalise repeated lateness even if average is low
  if (latePaymentsCount >= 3) {
    return "medium";
  }

  return "low";
};

/**
 * Count payments that arrived strictly after their linked credit entry's dueDate.
 */
const countLatePayments = async (customerId) => {
  const payments = await Entry.find({
    customerId,
    type: "payment",
    linkedEntryId: { $ne: null },
  })
    .populate("linkedEntryId", "dueDate")
    .lean();

  let count = 0;
  for (const p of payments) {
    const dueDate = p.linkedEntryId?.dueDate;
    if (!dueDate) continue;
    if (new Date(p.createdAt) > new Date(dueDate)) count++;
  }
  return count;
};

/**
 * Calculate and persist risk score for a customer.
 * Called after every payment and after every new entry creation.
 *
 * @returns {Promise<'low'|'medium'|'high'>} new risk label
 */
const calculateRisk = async (customerId) => {
  const [stats, latePaymentsCount] = await Promise.all([
    getCustomerStats(customerId),
    countLatePayments(customerId),
  ]);

  const riskScore = deriveRiskLabel(stats, latePaymentsCount);

  await Customer.findByIdAndUpdate(customerId, { riskScore });

  return riskScore;
};

module.exports = { calculateRisk, deriveRiskLabel, countLatePayments };
