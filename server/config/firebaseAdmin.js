/**
 * firebaseAdmin.js
 *
 * Handles backend Firebase Admin SDK initialization.
 * Priority order:
 *   1. Local service account JSON file (development)
 *   2. FIREBASE_SERVICE_ACCOUNT_JSON env var (production - recommended)
 *   3. Individual FIREBASE_* env vars (fallback)
 *   4. GOOGLE_APPLICATION_CREDENTIALS (GCP default)
 */

"use strict";

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseInitialized = false;

try {
  if (admin.apps.length > 0) {
    // Already initialized (e.g. hot-reload)
    firebaseInitialized = true;
  } else {
    const localCertPath = path.join(
      __dirname,
      "./voicekhata-b6152-firebase-adminsdk-fbsvc-aba3afb0fa.json"
    );

    if (fs.existsSync(localCertPath)) {
      // ── 1. Local JSON file (development) ─────────────────────────────────
      const serviceAccount = require(localCertPath);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      firebaseInitialized = true;
      console.log("[Firebase Admin] Initialized with local service account file.");

    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      // ── 2. Full JSON string env var (production - RECOMMENDED) ───────────
      let parsed;
      try {
        parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (parseErr) {
        // Sometimes the JSON is double-escaped or wrapped in quotes; try again
        parsed = JSON.parse(
          process.env.FIREBASE_SERVICE_ACCOUNT_JSON.replace(/^"|"$/g, "")
        );
      }
      // Ensure private_key newlines are real newlines (not escaped)
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      admin.initializeApp({ credential: admin.credential.cert(parsed) });
      firebaseInitialized = true;
      console.log("[Firebase Admin] Initialized with FIREBASE_SERVICE_ACCOUNT_JSON.");

    } else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64)
    ) {
      // ── 3. Individual env vars ────────────────────────────────────────────
      let privateKey;

      if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
        const clean = process.env.FIREBASE_PRIVATE_KEY_BASE64.replace(/\s/g, "");
        privateKey = Buffer.from(clean, "base64").toString("utf8");
        console.log("[Firebase Admin] Decoded private key from Base64.");
      } else {
        // Handle both quoted and unquoted, and both \\n and real newlines
        privateKey = process.env.FIREBASE_PRIVATE_KEY
          .replace(/^"|"$/g, "")   // strip surrounding quotes
          .replace(/\\n/g, "\n");  // convert escaped newlines to real newlines
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId:   process.env.FIREBASE_PROJECT_ID.trim(),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
          privateKey,
        }),
      });
      firebaseInitialized = true;
      console.log("[Firebase Admin] Initialized with individual env credentials.");

    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // ── 4. GCP Application Default Credentials ────────────────────────────
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      firebaseInitialized = true;
      console.log("[Firebase Admin] Initialized with application default credentials.");

    } else {
      console.warn(
        "[Firebase Admin] No credentials found. " +
        "Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable on Render."
      );
    }
  }
} catch (err) {
  console.error("[Firebase Admin] Initialization error:", err.message);
  firebaseInitialized = false;
}

module.exports = { admin, firebaseInitialized };
