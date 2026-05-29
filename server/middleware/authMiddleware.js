/**
 * authMiddleware.js
 * Verifies the custom JWT session token on every protected route.
 * Attaches { id, firebaseUid } to req.user.
 */

"use strict";

const jwt = require("jsonwebtoken");
const appConfig = require("../config/appConfig");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied: no Bearer token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, appConfig.jwtSecret);
    req.user = { id: decoded.id, firebaseUid: decoded.firebaseUid };
    return next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Invalid session token.";

    return res.status(401).json({ success: false, message });
  }
};

module.exports = { authMiddleware };
