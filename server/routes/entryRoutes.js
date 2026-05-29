const express = require('express');
const router = express.Router();
const {
  createEntry,
  getEntries,
  getEntryById,
  updateEntryStatus,
  makePayment,
  getReceipt,
  fetchPaymentHistory,
  getCustomerEntries,
} = require('../controllers/entryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation/validateRequest');

// All entry routes require authentication
router.use(authMiddleware);

// Standard routes
router.route('/').get(getEntries).post(validateRequest('entry'), createEntry);

// Customer-specific entries (static segments must precede wildcard routes)
router.get('/customer/:customerId', getCustomerEntries);

router.route('/:id').get(getEntryById);
router.route('/:id/status').patch(updateEntryStatus);

// Payment
router.post('/:id/pay', makePayment);

// Transaction receipts and linked payment history
router.get('/:id/receipt', getReceipt);
router.get('/:id/payments', fetchPaymentHistory);

module.exports = router;
