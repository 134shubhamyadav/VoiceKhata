"use strict";

const Customer = require('../models/Customer');
const Entry = require('../models/Entry');
const asyncHandler = require('../middleware/asyncHandler');
const { getCustomerDetails } = require('../services/customerDetailsService');

// POST /api/customers
const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  const customer = await Customer.create({ userId, name, phone });

  res.status(201).json({ success: true, data: customer });
});

// GET /api/customers?sort=<sort>
const getCustomers = asyncHandler(async (req, res) => {
  const { sort } = req.query;
  const userId = req.user.id;

  let sortOption = { name: 1 };
  if (sort === "highDue") sortOption = { totalOwed: -1 };
  else if (sort === "risk") sortOption = { riskScore: -1 };
  else if (sort === "recentActivity") sortOption = { updatedAt: -1 };
  else if (sort === "createdAt") sortOption = { createdAt: -1 };

  const query = { userId, isActive: true };
  const customers = await Customer.find(query).sort(sortOption).lean();

  return res.json({
    success: true,
    data: {
      items: customers,
      pagination: {
        total: customers.length,
        page: 1,
        limit: customers.length,
        totalPages: 1,
      },
    },
  });
});

// GET /api/customers/:id
const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ _id: req.params.id, userId: req.user.id });

  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found or access denied.' });
  }

  res.json({ success: true, data: customer });
});

// PATCH /api/customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'isActive'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    updates,
    { new: true, runValidators: true }
  );

  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found or access denied.' });
  }

  res.json({ success: true, data: customer });
});

// GET /api/customers/:id/details
const getCustomerDetailsController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Ensure the customer belongs to this user
  const customerExists = await Customer.findOne({ _id: id, userId });
  if (!customerExists) {
    return res.status(404).json({ success: false, message: 'Customer not found or access denied.' });
  }

  const result = await getCustomerDetails(id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  // Data consistency check: sync totalOwed with actual entries
  const pendingEntries = await Entry.find({
    customerId: id,
    userId,
    type: 'credit',
    status: { $in: ['pending', 'partial'] },
  }).lean();

  const actualOwed = pendingEntries.reduce((sum, e) => sum + (e.remainingAmount ?? e.amount), 0);

  if (result.customer.totalOwed !== actualOwed) {
    await Customer.findByIdAndUpdate(id, { totalOwed: actualOwed });
    result.customer.totalOwed = actualOwed;
  }

  res.json({ success: true, data: result });
});

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerDetailsController,
};