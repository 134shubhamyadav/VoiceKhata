const Customer = require("../models/Customer");
const Entry = require("../models/Entry");
const mongoose = require("mongoose");

const TOP_N = 5;

const RISK_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0
};

/**
 * Aggregate shop-wide insights in a single pass over Entry + Customer collections.
 */
const getInsights = async () => {
  // --- Aggregated entry totals ---
  const [creditAgg, paymentAgg] = await Promise.all([
    Entry.aggregate([
      { $match: { type: "credit" } },
      {
        $group: {
          _id: null,
          totalOutstanding: {
            $sum: {
              $cond: [{ $in: ["$status", ["pending", "partial", "overdue"]] }, "$remainingAmount", 0],
            },
          },
          totalIssued: { $sum: "$amount" },
        },
      },
    ]),
    Entry.aggregate([
      { $match: { type: "payment" } },
      { $group: { _id: null, totalRecovered: { $sum: "$amount" } } },
    ]),
  ]);

  const totalOutstanding = parseFloat((creditAgg[0]?.totalOutstanding ?? 0).toFixed(2));
  const totalRecovered = parseFloat((paymentAgg[0]?.totalRecovered ?? 0).toFixed(2));

  // --- Average delay across all settled credit entries ---
  const delayAgg = await Entry.aggregate([
    { $match: { type: "payment", linkedEntryId: { $ne: null } } },
    {
      $lookup: {
        from: "entries",
        localField: "linkedEntryId",
        foreignField: "_id",
        as: "creditEntry",
      },
    },
    { $unwind: "$creditEntry" },
    { $match: { "creditEntry.dueDate": { $ne: null } } },
    {
      $project: {
        delayDays: {
          $divide: [
            { $subtract: ["$createdAt", "$creditEntry.dueDate"] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
    { $group: { _id: null, avgDelay: { $avg: "$delayDays" } } },
  ]);

  const avgDelay = parseFloat((delayAgg[0]?.avgDelay ?? 0).toFixed(2));

  // --- Top risk customers (high risk, highest outstanding) ---
  const topRiskCustomers = await Customer.find({ riskScore: "high" })
    .sort({ totalOwed: -1 })
    .limit(TOP_N)
    .select("name totalOwed riskScore")
    .lean();

  // --- Best customers (low risk, highest total paid) ---
  const bestCustomerAgg = await Entry.aggregate([
    { $match: { type: "payment" } },
    { $group: { _id: "$customerId", totalPaid: { $sum: "$amount" } } },
    { $sort: { totalPaid: -1 } },
    { $limit: TOP_N * 3 }, // over-fetch to allow filtering by riskScore
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },
    { $match: { "customer.riskScore": "low" } },
    { $limit: TOP_N },
    {
      $project: {
        _id: 0,
        name: "$customer.name",
        amount: "$totalPaid",
        risk: "$customer.riskScore",
      },
    },
  ]);

  return {
    totalOutstanding,
    totalRecovered,
    avgDelay,
    topRiskCustomers: topRiskCustomers.map((c) => ({
      name: c.name,
      amount: c.totalOwed,
      risk: c.riskScore,
    })),
    bestCustomers: bestCustomerAgg,
  };
};

/**
 * Fetch merchant-specific insights.
 */
const getUserInsights = async (userId) => {
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [
    topRiskRaw,
    totalOutstandingResult,
    avgDelayResult,
  ] = await Promise.all([
    Customer.find({ userId: userObjId, isActive: true })
      .select('name totalOwed riskScore')
      .sort({ riskScore: -1, totalOwed: -1 })
      .limit(10)
      .lean(),

    Entry.aggregate([
      {
        $match: {
          userId: userObjId,
          type:   'credit',
          status: { $in: ['pending', 'overdue', 'partial'] },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [{ $in: ["$status", ["pending", "partial", "overdue"]] }, "$remainingAmount", "$amount"],
            },
          },
        },
      },
    ]),

    Entry.aggregate([
      {
        $match: {
          userId:  userObjId,
          type:    'credit',
          status:  'paid',
          dueDate: { $ne: null },
        },
      },
      {
        $addFields: {
          delayDays: {
            $max: [
              0,
              {
                $divide: [
                  { $subtract: ['$updatedAt', '$dueDate'] },
                  1000 * 60 * 60 * 24,
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id:      null,
          avgDelay: { $avg: '$delayDays' },
          count:    { $sum: 1 },
        },
      },
    ]),
  ]);

  const topRiskCustomers = topRiskRaw
    .sort((a, b) => (RISK_ORDER[b.riskScore] - RISK_ORDER[a.riskScore]) || (b.totalOwed - a.totalOwed))
    .slice(0, 5)
    .map((c) => ({
      name:      c.name,
      amount:    c.totalOwed,   // already in rupees
      riskScore: c.riskScore,
    }));

  const totalOutstanding = totalOutstandingResult[0]?.total ?? 0; // already in rupees
  const avgPaymentDelay  = avgDelayResult[0]
    ? parseFloat(avgDelayResult[0].avgDelay.toFixed(1))
    : 0;

  return {
    topRiskCustomers,
    totalOutstanding,
    avgPaymentDelay,
  };
};

module.exports = {
  getInsights,
  getUserInsights,
};
