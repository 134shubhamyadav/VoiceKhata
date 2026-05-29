"use strict";

const mongoose = require("mongoose");
const { sendReminder } = require("../services/reminderService");
const Reminder = require("../models/Reminder");
const Customer = require("../models/Customer");
const Entry = require("../models/Entry");
const asyncHandler = require("../middleware/asyncHandler");

/**
 * POST /api/reminders/send or POST /api/reminders
 * Body: { customerId, entryId, tone, type }
 */
const sendReminderHandler = asyncHandler(async (req, res) => {
  const { customerId, tone, message, entryId } = req.body;
  const userId = req.user.id;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      message: "customerId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ success: false, message: "Invalid customerId" });
  }

  // Ensure the customer belongs to the authenticated user
  const customer = await Customer.findOne({ _id: customerId, userId });
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found or access denied." });
  }

  let resolvedEntryId = entryId;
  // If entryId is not provided and it's NOT a custom manual message, resolve the most recent outstanding credit entry
  if (!resolvedEntryId && !message) {
    const activeEntry = await Entry.findOne({
      customerId,
      userId,
      type: "credit",
      status: { $in: ["pending", "partial"] }
    }).sort({ createdAt: -1 });

    if (!activeEntry) {
      return res.status(400).json({
        success: false,
        message: "No outstanding credit entries found for this customer to remind.",
      });
    }
    resolvedEntryId = activeEntry._id;
  }

  if (resolvedEntryId && !mongoose.Types.ObjectId.isValid(resolvedEntryId)) {
    return res.status(400).json({ success: false, message: "Invalid entryId" });
  }

  // Ensure entry belongs to this customer and user if provided
  if (resolvedEntryId) {
    const entry = await Entry.findOne({ _id: resolvedEntryId, customerId, userId, type: "credit" });
    if (!entry) {
      return res.status(404).json({ success: false, message: "Entry not found or access denied." });
    }
  }

  // Call sendReminder in service
  const reminder = await sendReminder(customerId, resolvedEntryId, tone || "friendly", message);

  return res.status(201).json({
    success: true,
    data: reminder,
  });
});

/**
 * GET /api/reminders/customer/:customerId
 * Returns reminder history for a customer
 */
const getCustomerReminders = asyncHandler(async (req, res) => {
  const { customerId } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return res.status(400).json({ success: false, message: "Invalid customerId" });
  }

  // Ensure the customer belongs to this user
  const customer = await Customer.findOne({ _id: customerId, userId });
  if (!customer) {
    return res.status(404).json({ success: false, message: "Customer not found or access denied." });
  }

  const reminders = await Reminder.find({ customerId })
    .populate("entryId", "amount remainingAmount status dueDate")
    .sort({ sentAt: -1 });

  return res.status(200).json({
    success: true,
    data: reminders,
  });
});

/**
 * GET /api/reminders
 * Returns all reminder logs for the merchant's customers
 */
const getReminders = asyncHandler(async (req, res) => {
  const { customerId, page = 1, limit = 20 } = req.query;
  const userId = req.user.id;

  const filter = {};

  if (customerId) {
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customerId" });
    }
    // Ensure the customer belongs to this user
    const customer = await Customer.findOne({ _id: customerId, userId });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found or access denied." });
    }
    filter.customerId = customerId;
  } else {
    // Only return reminders for customers belonging to this merchant
    const customers = await Customer.find({ userId, isActive: true }).select("_id");
    const customerIds = customers.map(c => c._id);
    filter.customerId = { $in: customerIds };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [reminders, total] = await Promise.all([
    Reminder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("customerId", "name phone")
      .populate("entryId", "amount type status dueDate"),
    Reminder.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: reminders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

module.exports = {
  sendReminder: sendReminderHandler,
  sendReminderHandler,
  getCustomerReminders,
  getReminders,
};
