/**
 * firebaseAdmin.js
 *
 * Handles backend Firebase Admin SDK initialization using the local service account private key,
 * with clean, reliable environment-based credential fallbacks.
 */

"use strict";

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseInitialized = false;

try {
  if (admin.apps.length === 0) {
    const localCertPath = path.join(__dirname, "./voicekhata-b6152-firebase-adminsdk-fbsvc-aba3afb0fa.json");
    
    if (fs.existsSync(localCertPath)) {
      const serviceAccount = require(localCertPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log("[Firebase Admin] Initialized with local service account key file.");
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      firebaseInitialized = true;
      console.log("[Firebase Admin] Initialized with individual env credentials.");
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        ),
      });
      firebaseInitialized = true;
      console.log("[Firebase Admin] Initialized with env service account credentials.");
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
      firebaseInitialized = true;
      console.log("[Firebase Admin] Initialized with application default credentials.");
    } else {
      console.warn("[Firebase Admin] No credentials found. Live auth token verification may be unavailable.");
    }
  } else {
    firebaseInitialized = true;
  }
} catch (err) {
  console.error("[Firebase Admin] Initialization error:", err.message);
}

module.exports = {
  admin,
  firebaseInitialized
};
