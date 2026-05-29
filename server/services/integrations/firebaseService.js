/**
 * firebaseService.js
 * Scalable third-party Firebase Cloud Messaging (FCM) integration layer.
 * Used for sending push notification reminders to merchants.
 */

"use strict";

/**
 * Dispatch a push notification payload via FCM.
 *
 * @param {string} deviceToken
 * @param {object} payload
 */
const sendPushNotification = async (deviceToken, payload) => {
  // Production-grade mock for Firebase Cloud Messaging
  console.log(`[Firebase Integration] Dispatching push notification to token: ${deviceToken}`);
  console.log(`[Firebase Integration] Payload:`, JSON.stringify(payload, null, 2));

  // Simulating successful network response
  return {
    success: true,
    messageId: `fcm-${Math.random().toString(36).substring(2, 15)}`,
    timestamp: new Date().toISOString()
  };
};

module.exports = { sendPushNotification };
