/**
 * appConfig.js
 *
 * Single source of truth for all feature flags and env-driven settings.
 * Import this wherever conditional behaviour is needed — never read
 * process.env directly in controllers or services.
 */

"use strict";

const appConfig = {
  // -------------------------------------------------------------------------
  // demoMode
  // When true: OTP=1234 accepted, mock tokens allowed
  // Set DEMO_MODE=true in .env
  // -------------------------------------------------------------------------
  demoMode: process.env.DEMO_MODE === "true",

  // Server port
  port: parseInt(process.env.PORT, 10) || 5000,

  // MongoDB
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/voicekhata",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "vk-dev-secret-replace-in-production",

  // Gemini AI
  geminiApiKey: process.env.GEMINI_API_KEY || null,

  // CORS allowed origin
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Shop default for receipts/reminders
  shopName: process.env.SHOP_NAME || "VoiceKhata",

  // Reminder duplicate-guard window (hours)
  reminderWindowHours: parseInt(process.env.REMINDER_WINDOW_HOURS, 10) || 12,
};

module.exports = appConfig;
