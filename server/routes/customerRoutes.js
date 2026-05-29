const express = require('express');
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerDetailsController,
} = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validation/validateRequest');

// All customer routes require authentication
router.use(authMiddleware);

router.route('/').get(getCustomers).post(validateRequest('customer'), createCustomer);
router.route('/:id').get(getCustomerById).patch(updateCustomer);
router.route('/:id/details').get(getCustomerDetailsController);

module.exports = router;
