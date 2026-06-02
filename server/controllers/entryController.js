"use strict";

const mongoose     = require('mongoose');
const Entry        = require('../models/Entry');
const Customer     = require('../models/Customer');
const asyncHandler = require('../middleware/asyncHandler');
const { calculateRisk }          = require('../services/riskService');
const { processPayment }         = require('../services/paymentService');
const { generateReceipt }        = require('../services/receiptService');

// ─── Private helpers ──────────────────────────────────────────────────────────

const DUPLICATE_WINDOW_MS = 10 * 1000; // 10 seconds

/**
 * Returns true if an identical entry (same customerId + amount in rupees)
 * was already created within the last 10 seconds — double-submit guard.
 */
const isDuplicateEntry = async (customerId, amount) => {
  if (!customerId) return false;
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const existing = await Entry.findOne({
    customerId,
    amount: Number(amount),
    createdAt: { $gte: since },
  });
  return !!existing;
};

/**
 * resolveCustomer
 * Priority: customerId → customerName (find or create WITHOUT fake phone).
 * Returns { customer, isNew } or sends an error response.
 */
const resolveCustomer = async ({ customerId, customerName, userId, phone }, session, res) => {
  if (customerId) {
    const customer = await Customer
      .findOne({ _id: customerId, isActive: true })
      .session(session);

    if (!customer) {
      res.status(404).json({ success: false, message: 'Customer not found.' });
      return null;
    }
    return { customer, isNew: false };
  }

  if (customerName) {
    const nameRegex = new RegExp(`^${customerName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

    let customer = await Customer
      .findOne({ userId, name: nameRegex, isActive: true })
      .session(session);

    if (customer) return { customer, isNew: false };

    // Auto-create with real phone (if provided) or null
    [customer] = await Customer.create(
      [{ userId, name: customerName.trim(), phone: phone || null, riskScore: 'low' }],
      { session }
    );
    return { customer, isNew: true };
  }

  res.status(400).json({ success: false, message: 'customerId or customerName is required.' });
  return null;
};

/**
 * allocatePaymentFIFO
 * Automatically allocates a payment amount to satisfy oldest outstanding credit entries.
 */
/**
 * selfHealCustomerBalances
 * Performs a complete retrospective FIFO reallocation of all payment entries 
 * against all credit entries for a customer to guarantee consistency.
 */
const selfHealCustomerBalances = async (customerId, session = null) => {
  const query = Entry.find({ customerId }).sort({ createdAt: 1 });
  if (session) query.session(session);
  const entries = await query;

  const credits = entries.filter(e => e.type === 'credit');
  const payments = entries.filter(e => e.type === 'payment');

  // Reset all credit entries to pending status and remainingAmount to amount
  for (const credit of credits) {
    credit.remainingAmount = credit.amount;
    credit.status = 'pending';
  }

  // Allocate payment amounts to credits in FIFO order
  for (const payment of payments) {
    let remainingPayment = payment.amount;
    for (const credit of credits) {
      if (remainingPayment <= 0) break;

      const currentRemaining = credit.remainingAmount !== undefined ? credit.remainingAmount : credit.amount;
      if (currentRemaining <= 0) continue;

      if (remainingPayment >= currentRemaining) {
        remainingPayment = parseFloat((remainingPayment - currentRemaining).toFixed(2));
        credit.remainingAmount = 0;
        credit.status = 'paid';
      } else {
        credit.remainingAmount = parseFloat((currentRemaining - remainingPayment).toFixed(2));
        credit.status = 'partial';
        remainingPayment = 0;
      }
    }
  }

  // Save all modified credit entries using direct findOneAndUpdate to bypass Mongoose document state issues
  for (const credit of credits) {
    const updateObj = { remainingAmount: credit.remainingAmount, status: credit.status };
    if (session) {
      await Entry.findOneAndUpdate({ _id: credit._id }, updateObj, { session });
    } else {
      await Entry.findOneAndUpdate({ _id: credit._id }, updateObj);
    }
  }

  // Recalculate totalOwed
  const totalOwed = credits.reduce((sum, e) => {
    const remaining = e.remainingAmount !== undefined ? e.remainingAmount : e.amount;
    return parseFloat((sum + remaining).toFixed(2));
  }, 0);

  // Update customer totalOwed using direct findOneAndUpdate
  if (session) {
    await Customer.findOneAndUpdate({ _id: customerId }, { totalOwed }, { session });
  } else {
    await Customer.findOneAndUpdate({ _id: customerId }, { totalOwed });
  }

  return totalOwed;
};

const deriveStatus = (type, explicitStatus) => {
  if (explicitStatus) return explicitStatus;
  return type === 'credit' ? 'pending' : 'paid';
};

/**
 * applyBalanceDelta — amounts are in RUPEES (not paise).
 */
const applyBalanceDelta = (current, amount, type) => {
  const delta = type === 'credit' ? amount : -amount;
  return parseFloat(Math.max(0, current + delta).toFixed(2));
};

// ─── Controllers ──────────────────────────────────────────────────────────────

// POST /api/entries
const createEntry = asyncHandler(async (req, res) => {
  const {
    customerId,
    customerName,
    userId,
    amount,
    type,
    status: rawStatus,
    dueDate,
    note,
    voiceTranscript,
    proofUrl,
    phone,
  } = req.body;

  // Use authenticated user id as fallback if not in body
  const resolvedUserId = userId || (req.user && req.user.id);

  if (!resolvedUserId) {
    return res.status(400).json({ success: false, message: 'userId is required.' });
  }

  if (!customerId && !customerName) {
    return res.status(400).json({
      success: false,
      message: 'customerId or customerName is required.',
    });
  }

  // Validate amount — RUPEES (number, > 0)
  const numAmount = Number(amount);
  if (!amount || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'amount must be a positive number (rupees).',
    });
  }

  if (!type || !['credit', 'payment', 'cashbook_in', 'cashbook_out'].includes(type)) {
    return res.status(400).json({ success: false, message: 'type must be credit, payment, cashbook_in, or cashbook_out.' });
  }

  // Cashbook entries don't require a customer
  const isCashbook = type === 'cashbook_in' || type === 'cashbook_out';

  // Duplicate guard (only for ledger entries with a known customerId)
  if (!isCashbook && customerId && await isDuplicateEntry(customerId, numAmount)) {
    return res.status(409).json({ success: false, message: 'Duplicate entry detected. Please wait a moment.' });
  }

  const status = deriveStatus(type, rawStatus);

  if (isCashbook) {
    // Cashbook entries — no customer, no transaction
    const [entry] = await Entry.create([{
      customerId:     null,
      userId:         resolvedUserId,
      amount:         numAmount,
      type,
      status:         'paid',
      dueDate:        dueDate || null,
      note:           note    || null,
      voiceTranscript: voiceTranscript || null,
    }]);

    return res.status(201).json({
      success: true,
      data: { entry },
    });
  }

  // Ledger entry — requires customer, uses ACID transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const resolved = await resolveCustomer(
      { customerId, customerName, userId: resolvedUserId, phone },
      session,
      res
    );

    if (!resolved) {
      await session.abortTransaction();
      return;
    }

    const { customer, isNew } = resolved;

    const [entry] = await Entry.create(
      [{
        customerId:      customer._id,
        userId:          resolvedUserId,
        amount:          numAmount,
        type,
        status,
        dueDate:         dueDate         || null,
        note:            note            || null,
        voiceTranscript: voiceTranscript || null,
        proofUrl:        proofUrl        || null,
      }],
      { session }
    );

    // Dynamically self-heal customer balance and entries to ensure absolute consistency
    await selfHealCustomerBalances(customer._id, session);
    await session.commitTransaction();
    session.endSession();

    // Recalculate risk (non-blocking, outside transaction)
    await calculateRisk(customer._id);

    const populated = await Entry
      .findById(entry._id)
      .populate('customerId', 'name phone totalOwed riskScore');

    return res.status(201).json({
      success: true,
      data: {
        entry: populated,
        customer: {
          _id:       customer._id,
          name:      customer.name,
          phone:     customer.phone || null,
          totalOwed: customer.totalOwed,
          riskScore: customer.riskScore,
          isNew,
        },
      },
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

// GET /api/entries
const getEntries = asyncHandler(async (req, res) => {
  const {
    customerId,
    userId,
    type,
    status,
    page  = 1,
    limit = 20,
    sort  = '-createdAt',
  } = req.query;

  const ALLOWED_SORT = new Set([
    'createdAt', '-createdAt',
    'amount',    '-amount',
    'dueDate',   '-dueDate',
  ]);

  if (!ALLOWED_SORT.has(sort)) {
    return res.status(400).json({ success: false, message: 'Invalid sort field.' });
  }

  // Scope to the authenticated user strictly
  const filter = { userId: req.user.id };
  if (customerId) filter.customerId = customerId;
  if (type)       filter.type       = type;
  if (status)     filter.status     = status;

  const skip    = (Number(page) - 1) * Number(limit);
  const sortObj = sort.startsWith('-')
    ? { [sort.slice(1)]: -1 }
    : { [sort]: 1 };

  const [entries, total] = await Promise.all([
    Entry.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('customerId', 'name phone totalOwed riskScore'),
    Entry.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      items: entries,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// GET /api/entries/:id
const getEntryById = asyncHandler(async (req, res) => {
  const entry = await Entry
    .findOne({ _id: req.params.id, userId: req.user.id })
    .populate('customerId', 'name phone totalOwed riskScore');

  if (!entry) {
    return res.status(404).json({ success: false, message: 'Entry not found or access denied.' });
  }

  res.json({ success: true, data: entry });
});

// PATCH /api/entries/:id/status
const updateEntryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ALLOWED = ['pending', 'paid', 'overdue', 'disputed', 'partial'];

  if (!status || !ALLOWED.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${ALLOWED.join(', ')}.`,
    });
  }

  const entry = await Entry
    .findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { status }, { new: true, runValidators: true })
    .populate('customerId', 'name phone totalOwed riskScore');

  if (!entry) {
    return res.status(404).json({ success: false, message: 'Entry not found or access denied.' });
  }

  await calculateRisk(entry.customerId._id || entry.customerId);

  res.json({ success: true, data: entry });
});

// POST /api/entries/:id/pay
// Supports partial or full payment via paymentService
const makePayment = asyncHandler(async (req, res) => {
  const { paidAmount, paymentMethod = 'cash' } = req.body;

  if (paidAmount === undefined || paidAmount === null) {
    return res.status(400).json({ success: false, message: 'paidAmount is required.' });
  }

  const numericAmount = parseFloat(paidAmount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: 'paidAmount must be a positive number.' });
  }

  const creditEntry = await Entry.findOne({ _id: req.params.id, type: 'credit', userId: req.user.id });
  if (!creditEntry) {
    return res.status(404).json({ success: false, message: 'Credit entry not found or access denied.' });
  }

  const result = await processPayment({
    entryId:       req.params.id,
    amountPaid:    numericAmount,
    paymentMethod,
    userId:        req.user.id,
  });

  const customer = await Customer.findById(creditEntry.customerId);
  const receipt  = generateReceipt(result.updatedEntry, customer);

  return res.status(200).json({
    success: true,
    data: {
      entry:        result.updatedEntry,
      paymentEntry: result.paymentEntry,
      summary:      result.summary,
      receipt,
    },
  });
});

// GET /api/entries/:id/receipt
const getReceipt = asyncHandler(async (req, res) => {
  const entry = await Entry.findOne({ _id: req.params.id, userId: req.user.id });
  if (!entry) {
    return res.status(404).json({ success: false, message: 'Entry not found or access denied.' });
  }

  const customer = await Customer.findOne({ _id: entry.customerId, userId: req.user.id });
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found or access denied.' });
  }

  const receipt = generateReceipt(entry, customer);
  return res.status(200).json({ success: true, data: receipt });
});

// GET /api/entries/:id/payments
const fetchPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Entry.find({
    linkedEntryId: req.params.id,
    type: 'payment',
    userId: req.user.id,
  }).sort({ createdAt: -1 });

  return res.status(200).json({ success: true, data: payments });
});

// GET /api/entries/customer/:customerId
const getCustomerEntries = asyncHandler(async (req, res) => {
  // Ensure the customer belongs to this user
  const customer = await Customer.findOne({ _id: req.params.customerId, userId: req.user.id });
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found or access denied.' });
  }

  const entries = await Entry
    .find({ customerId: req.params.customerId, userId: req.user.id })
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, data: entries });
});

// DELETE /api/entries/:id
const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await Entry.findOne({ _id: req.params.id, userId: req.user.id });

  if (!entry) {
    return res.status(404).json({ success: false, message: 'Entry not found or access denied.' });
  }

  const customerId = entry.customerId;

  await Entry.deleteOne({ _id: req.params.id });

  // Self-heal customer balances after transaction cancellation
  if (customerId) {
    await selfHealCustomerBalances(customerId);
  }

  res.json({ success: true, message: 'Transaction cancelled successfully.' });
});

module.exports = {
  createEntry,
  getEntries,
  getEntryById,
  updateEntryStatus,
  makePayment,
  getReceipt,
  fetchPaymentHistory,
  getCustomerEntries,
  deleteEntry,
  selfHealCustomerBalances,
};
