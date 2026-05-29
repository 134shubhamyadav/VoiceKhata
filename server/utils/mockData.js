/**
 * mockData.js
 *
 * Static fallback payloads returned when the DB is unavailable.
 * Used by dashboard and insights endpoints in demo mode.
 *
 * All amounts in ₹ INR.
 */

"use strict";

const MOCK_DASHBOARD_SUMMARY = {
  _isMock: true,
  totals: {
    totalOwed:        18750,
    totalCustomers:   10,
    overdueAmount:    7200,
    overdueCount:     4,
    partialAmount:    3850,
    partialCount:     3,
  },
  recentEntries: [
    {
      _id:             "mock_entry_001",
      customerName:    "Ramesh Kumar Sharma",
      amount:          2200,
      remainingAmount: 2200,
      type:            "credit",
      status:          "pending",
      dueDate:         new Date(Date.now() + 10 * 86400000).toISOString(),
      createdAt:       new Date(Date.now() - 2  * 86400000).toISOString(),
    },
    {
      _id:             "mock_entry_002",
      customerName:    "Mohammad Irfan Shaikh",
      amount:          2500,
      remainingAmount: 2500,
      type:            "credit",
      status:          "pending",
      dueDate:         new Date(Date.now() - 15 * 86400000).toISOString(),
      createdAt:       new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      _id:             "mock_entry_003",
      customerName:    "Deepak Nair",
      amount:          4500,
      remainingAmount: 4000,
      type:            "credit",
      status:          "partial",
      dueDate:         new Date(Date.now() - 40 * 86400000).toISOString(),
      createdAt:       new Date(Date.now() - 55 * 86400000).toISOString(),
    },
    {
      _id:             "mock_entry_004",
      customerName:    "Priya Mehta",
      amount:          1200,
      remainingAmount: 1200,
      type:            "credit",
      status:          "pending",
      dueDate:         new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt:       new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      _id:             "mock_entry_005",
      customerName:    "Rekha Bose Chatterjee",
      amount:          3500,
      remainingAmount: 3500,
      type:            "credit",
      status:          "pending",
      dueDate:         new Date(Date.now() - 30 * 86400000).toISOString(),
      createdAt:       new Date(Date.now() - 45 * 86400000).toISOString(),
    },
  ],
  topDebtors: [
    { customerName: "Rekha Bose Chatterjee", totalOwed: 9950, riskScore: 85 },
    { customerName: "Deepak Nair",           totalOwed: 8950, riskScore: 78 },
    { customerName: "Mohammad Irfan Shaikh", totalOwed: 8200, riskScore: 58 },
  ],
  riskBreakdown: {
    low:    3,   // riskScore  0–30
    medium: 4,   // riskScore 31–60
    high:   3,   // riskScore 61–100
  },
};

const MOCK_INSIGHTS = {
  _isMock: true,
  overdueCustomers: [
    {
      customerName: "Mohammad Irfan Shaikh",
      phone:        "9870078901",
      overdueAmount: 4100,
      daysOverdue:  15,
      riskScore:    58,
    },
    {
      customerName: "Kavita Rajput",
      phone:        "9880089012",
      overdueAmount: 3100,
      daysOverdue:  8,
      riskScore:    62,
    },
    {
      customerName: "Deepak Nair",
      phone:        "9890090123",
      overdueAmount: 8950,
      daysOverdue:  40,
      riskScore:    78,
    },
    {
      customerName: "Rekha Bose Chatterjee",
      phone:        null,
      overdueAmount: 9950,
      daysOverdue:  20,
      riskScore:    85,
    },
  ],
  collectionRate: 0.42,
  avgDaysToPayment: 18,
};

module.exports = { MOCK_DASHBOARD_SUMMARY, MOCK_INSIGHTS };
