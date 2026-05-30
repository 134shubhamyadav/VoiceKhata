const mongoose = require("mongoose");

/**
 * Fix: Drop the old non-sparse phone_1 index on users collection.
 * The original index was created without sparse:true, so multiple
 * Google sign-in users (who all have phone=null) hit E11000.
 * This migration drops & lets Mongoose recreate it correctly as sparse.
 */
const fixUserPhoneIndex = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection("users");
    const indexes = await collection.indexes();
    const phoneIndex = indexes.find(
      (ix) => ix.name === "phone_1" && !ix.sparse
    );
    if (phoneIndex) {
      await collection.dropIndex("phone_1");
      console.log("[DB Migration] Dropped non-sparse phone_1 index on users. Will be recreated as sparse.");
    }
  } catch (err) {
    // Index may not exist yet — safe to ignore
    if (!err.message.includes("index not found")) {
      console.warn("[DB Migration] Could not fix phone index:", err.message);
    }
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Run one-time index migrations
    await fixUserPhoneIndex();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;