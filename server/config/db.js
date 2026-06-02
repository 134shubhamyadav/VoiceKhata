const mongoose = require("mongoose");

/**
 * Migration: Drop non-sparse unique indexes on users.phone and users.email.
 *
 * Background: MongoDB sparse unique indexes skip documents where the field
 * is ABSENT. But if the field is explicitly set to null (via default:null),
 * MongoDB DOES index the null value and enforces uniqueness — meaning only
 * one user can have phone:null. This breaks Google sign-in for all users
 * after the first.
 *
 * Fix: Drop the old indexes so Mongoose recreates them as sparse, AND ensure
 * the model never writes null for absent optional fields.
 */
const fixUserIndexes = async () => {
  try {
    const collection = mongoose.connection.db.collection("users");
    const indexes = await collection.indexes();

    for (const ix of indexes) {
      const isPhoneIndex = ix.name === "phone_1";
      const isEmailIndex = ix.name === "email_1";
      const needsFix = (isPhoneIndex || isEmailIndex) && !ix.sparse;

      if (needsFix) {
        await collection.dropIndex(ix.name);
        console.log(`[DB Migration] Dropped non-sparse ${ix.name} index — will be recreated as sparse.`);
      }
    }

    // Let Mongoose recreate indexes based on current schema definitions
    const User = require("../models/User");
    await User.syncIndexes();
    console.log("[DB Migration] User indexes synced successfully.");
  } catch (err) {
    if (!err.message?.includes("index not found")) {
      console.warn("[DB Migration] Could not fix user indexes:", err.message);
    }
  }
};

/**
 * Migration: Drop legacy compound unique index on customers.userId and customers.phone.
 *
 * Background: Legacy index did not use partialFilterExpression. Because phone defaults
 * to null, MongoDB indexes null and throws E11000 duplicate key error when a merchant
 * creates a second customer without a phone number.
 *
 * Fix: Drop legacy index so Mongoose can recreate it with a partialFilterExpression
 * filtering only string values.
 */
const fixCustomerIndexes = async () => {
  try {
    const collection = mongoose.connection.db.collection("customers");
    const indexes = await collection.indexes();

    for (const ix of indexes) {
      if (ix.name === "userId_1_phone_1") {
        if (!ix.partialFilterExpression) {
          await collection.dropIndex("userId_1_phone_1");
          console.log("[DB Migration] Dropped legacy non-partial userId_1_phone_1 index from customers.");
        }
      }
    }

    const Customer = require("../models/Customer");
    await Customer.syncIndexes();
    console.log("[DB Migration] Customer indexes synced successfully.");
  } catch (err) {
    if (!err.message?.includes("index not found")) {
      console.warn("[DB Migration] Could not fix customer indexes:", err.message);
    }
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Run one-time index migrations after connect
    await fixUserIndexes();
    await fixCustomerIndexes();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;