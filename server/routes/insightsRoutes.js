const express = require('express');
const router = express.Router();
const { getInsights } = require('../controllers/insightsController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Insights require authentication
router.use(authMiddleware);

router.get('/', getInsights);

module.exports = router;
