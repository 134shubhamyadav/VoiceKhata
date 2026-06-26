/**
 * authController.js
 *
 * Handles Firebase token verification, user creation, onboarding, and JWT signing.
 *
 * Demo mode (DEMO_MODE=true in .env):
 *   - Accepts tokens prefixed with "demo-" for UI simulation without real Firebase.
 *   - Never enable demo mode in production.
 */

"use strict";

const { admin, firebaseInitialized } = require("../config/firebaseAdmin");
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");
const appConfig = require("../config/appConfig");

// ─── Helpers ────────────────────────────────────────────────────────────────

const signJwt = (user) =>
  jwt.sign(
    { id: user._id, firebaseUid: user.firebaseUid },
    appConfig.jwtSecret,
    { expiresIn: "30d" }
  );

const userPayload = (user) => ({
  id:                  user._id,
  name:                user.name,
  phone:               user.phone,
  email:               user.email,
  shopName:            user.shopName,
  businessType:        user.businessType,
  language:            user.language,
  profilePhoto:        user.profilePhoto,
  upiId:               user.upiId,
  onboardingIncomplete: user.onboardingIncomplete,
});

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * POST /api/auth/verify-token
 * Verifies a Firebase ID token (or demo token) and returns a signed session JWT.
 */
const verifyToken = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: "idToken is required." });
  }

  try {
    let decodedToken;
    if (idToken.startsWith("demo-")) {
      if (idToken.includes("@")) {
        const email = idToken.replace("demo-", "");
        decodedToken = {
          uid: `demo-uid-${email}`,
          email: email,
          name: "Demo Merchant"
        };
      } else {
        const phone = idToken.replace("demo-", "+91");
        decodedToken = {
          uid: `demo-uid-${phone}`,
          phone_number: phone,
          name: "Demo Merchant"
        };
      }
    } else {
      if (!firebaseInitialized) {
        return res.status(503).json({
          success: false,
          message: "Firebase Admin is not initialized.",
        });
      }
      decodedToken = await admin.auth().verifyIdToken(idToken);
    }

    // ── User lookup and auto-create ───────────────────────────────────────
    const { uid, email, name, picture, phone_number } = decodedToken;
    let user = await User.findOne({ firebaseUid: uid });

    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        user.firebaseUid = uid;
        if (picture && !user.profilePhoto) user.profilePhoto = picture;
        await user.save();
      }
    }

    if (!user && phone_number) {
      user = await User.findOne({ phone: phone_number });
      if (user) {
        user.firebaseUid = uid;
        await user.save();
      }
    }

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      // Build insert payload — only include fields that have real values.
      // NEVER set phone:null or email:null explicitly — sparse unique indexes
      // still index null, causing E11000 when multiple Google users sign up.
      const insertData = {
        firebaseUid:          uid,
        name:                 name    || "Merchant",
        onboardingIncomplete: true,
      };
      if (email)        insertData.email        = email.toLowerCase().trim();
      if (phone_number) insertData.phone        = phone_number;
      if (picture)      insertData.profilePhoto = picture;

      user = await User.findOneAndUpdate(
        { firebaseUid: uid },
        { $setOnInsert: insertData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Auth] New merchant created for UID: ${uid}`);
    }

    const token = signJwt(user);

    return res.status(200).json({
      success: true,
      data: { token, user: userPayload(user), isNewUser },
    });

  } catch (err) {
    console.error("[Auth] Token verification failed:", err.message);
    // Hide raw MongoDB/internal errors from the client
    const isMongoError = err.code === 11000 || err.name === 'MongoServerError';
    const clientMsg = isMongoError
      ? "Account setup failed due to a data conflict. Please try again."
      : err.message;
    return res.status(401).json({ success: false, message: "Authentication failed: " + clientMsg });
  }
};

/**
 * POST /api/auth/complete-onboarding
 * Saves merchant profile and marks onboarding complete.
 */
const completeOnboarding = async (req, res) => {
  const { name, shopName, language, businessType, phone, email, profilePhoto, upiId } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.name         = name         !== undefined ? (name ? name.trim() : null) : user.name;
    user.shopName     = shopName     !== undefined ? (shopName ? shopName.trim() : null) : user.shopName;
    user.language     = language     !== undefined ? language : user.language;
    user.businessType = businessType !== undefined ? businessType : user.businessType;
    user.phone        = phone        !== undefined ? (phone ? phone.trim() : null) : user.phone;
    user.email        = email        !== undefined ? (email ? email.trim() : null) : user.email;
    user.profilePhoto = profilePhoto !== undefined ? profilePhoto : user.profilePhoto;
    user.upiId        = upiId        !== undefined ? (upiId ? upiId.trim() : null) : user.upiId;

    if (user.shopName) {
      user.onboardingIncomplete = false;
    }

    await user.save();
    console.log(`[Auth] Profile updated for merchant: ${user.name || user.shopName}`);

    return res.status(200).json({ success: true, data: { user: userPayload(user) } });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/auth/me
 * Returns the current user profile.
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    return res.status(200).json({ success: true, data: { user: userPayload(user) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/auth/clear-demo-data
 * Clears all entries, customers, and reminders for the current user.
 */
const clearDemoData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const Customer = require("../models/Customer");
    const Entry = require("../models/Entry");
    const Reminder = require("../models/Reminder");

    const customers = await Customer.find({ userId });
    const customerIds = customers.map(c => c._id);

    if (customerIds.length > 0) {
      await Reminder.deleteMany({ customerId: { $in: customerIds } });
    }

    await Entry.deleteMany({ userId });
    await Customer.deleteMany({ userId });

    return res.status(200).json({ success: true, message: "Demo data cleared successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { verifyToken, completeOnboarding, getMe, clearDemoData };
