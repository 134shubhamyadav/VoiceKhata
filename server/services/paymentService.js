const Entry = require("../models/Entry");
const Customer = require("../models/Customer");
const { calculateRisk } = require("./riskService");

/**
 * Process a payment (full or partial) against an existing credit entry.
 * Supports multiple sequential payments until fully settled.
 */
const processPayment = async ({ entryId, amountPaid, paymentMethod = "cash", userId }) => {
  const query = { _id: entryId };
  if (userId) query.userId = userId;
  const creditEntry = await Entry.findOne(query);
  if (!creditEntry) throw new Error("Entry not found");

  if (creditEntry.type !== "credit") throw new Error("Payment can only be applied to credit entries");

  if (creditEntry.status === "paid") throw new Error("Entry is already fully paid");

  if (!amountPaid || amountPaid <= 0) throw new Error("Invalid payment amount");

  const currentRemaining = creditEntry.remainingAmount ?? creditEntry.amount;

  if (amountPaid > currentRemaining) {
    throw new Error(`Payment amount (${amountPaid}) exceeds remaining balance (${currentRemaining})`);
  }

  const newRemaining = parseFloat((currentRemaining - amountPaid).toFixed(2));
  const newStatus = newRemaining === 0 ? "paid" : "partial";

  // Update the original credit entry
  creditEntry.remainingAmount = newRemaining;
  creditEntry.status = newStatus;
  await creditEntry.save();

  // Create a linked payment entry for audit trail
  const paymentEntry = await Entry.create({
    customerId: creditEntry.customerId,
    userId: creditEntry.userId, // Include userId so it passes validations and links properly
    amount: amountPaid,
    type: "payment",
    status: "paid",
    remainingAmount: 0,
    linkedEntryId: creditEntry._id,
    paymentMethod,
    dueDate: creditEntry.dueDate,
  });

  // Recalculate balance and risk score in parallel
  const [, { riskScore }] = await Promise.all([
    recalculateCustomerOwed(creditEntry.customerId),
    calculateRisk(creditEntry.customerId),
  ]);

  return {
    paymentEntry,
    updatedEntry: creditEntry,
    summary: {
      amountPaid,
      remainingAmount: newRemaining,
      status: newStatus,
      fullySettled: newStatus === "paid",
      riskScore,
    },
  };
};

/**
 * Recalculate and persist a customer's total outstanding balance.
 */
const recalculateCustomerOwed = async (customerId) => {
  const openEntries = await Entry.find({
    customerId,
    type: "credit",
    status: { $in: ["pending", "partial", "overdue"] },
  });

  const totalOwed = openEntries.reduce((sum, e) => {
    const remaining = e.remainingAmount ?? e.amount;
    return parseFloat((sum + remaining).toFixed(2));
  }, 0);

  await Customer.findByIdAndUpdate(customerId, { totalOwed });
  return totalOwed;
};

module.exports = { processPayment, recalculateCustomerOwed };
