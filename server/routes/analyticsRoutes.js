const express = require("express");
const router = express.Router();
const { getStats } = require("../controllers/analyticsController");
const { authMiddleware } = require("../middleware/authMiddleware");

// GET /api/analytics/:customerId
router.get("/:customerId", authMiddleware, getStats);

module.exports = router;
