const express = require("express");
const router = express.Router();
const { makePayment } = require("../controllers/paymentController");
const { authMiddleware } = require("../middleware/authMiddleware");

// POST /api/payments/:entryId
router.post("/:entryId", authMiddleware, makePayment);

module.exports = router;
