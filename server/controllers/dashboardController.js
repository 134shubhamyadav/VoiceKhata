const asyncHandler = require('../middleware/asyncHandler');
const { getDashboardSummaryData, getDashboardInsightsData, getBusinessSummary } = require('../services/dashboardService');

// GET /api/dashboard/summary
const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const data = await getDashboardSummaryData(userId);
  res.json({ success: true, data });
});

// GET /api/dashboard/insights
const getDashboardInsights = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const data = await getDashboardInsightsData(userId);
  res.json({ success: true, data });
});

// GET /api/dashboard/business-summary
const getBusinessSummaryController = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const summary = await getBusinessSummary(userId);
  res.json({ success: true, data: summary });
});

module.exports = { getDashboardSummary, getDashboardInsights, getBusinessSummaryController };
