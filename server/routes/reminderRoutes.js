const express = require('express');
const router = express.Router();
const {
  sendReminder,
  getReminders,
  getCustomerReminders,
  deleteReminder,
} = require('../controllers/reminderController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation/validateRequest');

// All reminder routes require authentication
router.use(authMiddleware);

// Send reminder
router.post('/send', validateRequest('reminder'), sendReminder);
router.post('/', validateRequest('reminder'), sendReminder);

// Query logs
router.get('/', getReminders);
router.get('/customer/:customerId', getCustomerReminders);

// Delete manually
router.delete('/:id', deleteReminder);

module.exports = router;
