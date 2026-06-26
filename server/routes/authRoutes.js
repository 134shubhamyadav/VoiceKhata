/**
 * authRoutes.js
 * Express routing layer for merchant authentication and verification pathways.
 */

"use strict";

const express = require("express");
const router = express.Router();
const { verifyToken, completeOnboarding, getMe, clearDemoData } = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Authentication Entrypoints
router.post("/verify-token", verifyToken);

// Protected Merchant Customization Pathways
router.post("/complete-onboarding", authMiddleware, completeOnboarding);
router.get("/me", authMiddleware, getMe);
router.delete("/clear-demo-data", authMiddleware, clearDemoData);

module.exports = router;
