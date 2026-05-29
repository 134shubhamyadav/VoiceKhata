const express = require('express');
const router = express.Router();
const { getDashboardSummary, getDashboardInsights, getBusinessSummaryController } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/summary', authMiddleware, getDashboardSummary);
router.get('/insights', authMiddleware, getDashboardInsights);
router.get('/business-summary', authMiddleware, getBusinessSummaryController);

module.exports = router;
