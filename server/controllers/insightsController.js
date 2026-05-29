"use strict";

const asyncHandler = require("../middleware/asyncHandler");
const { getUserInsights } = require("../services/insightsService");

// GET /api/insights
// Uses authenticated user ID from JWT — no userId query param needed
const getInsights = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const data   = await getUserInsights(userId);
  return res.status(200).json({ success: true, data });
});

module.exports = { getInsights };
