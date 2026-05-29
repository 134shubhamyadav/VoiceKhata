/**
 * seedData.js
 *
 * Populates the database with realistic demo data for VoiceKhata.
 * Safe to run multiple times — checks for existing data first.
 *
 * Standalone:  node scripts/seedData.js
 * Auto-called: from server.js boot if DB is empty
 */

"use strict";

const mongoose  = require("mongoose");
const Customer  = require("../models/Customer");
const Entry     = require("../models/Entry");
const appConfig = require("../config/appConfig");

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const daysFromNow = (d) => new Date(Date.now() + d * 86400000);
const daysAgo     = (d) => new Date(Date.now() - d * 86400000);
const r2          = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Customer profiles
// ---------------------------------------------------------------------------

const CUSTOMER_PROFILES = [
  // ── Good payers (3) ──────────────────────────────────────────────────────
  { name: "Ramesh Kumar Sharma",   phone: "9810012345", type: "good",      riskScore: 8  },
  { name: "Sunita Devi Agarwal",   phone: "9920023456", type: "good",      riskScore: 12 },
  { name: "Vijay Prakash Gupta",   phone: "9830034567", type: "good",      riskScore: 5  },

  // ── Average payers (3) ───────────────────────────────────────────────────
  { name: "Priya Mehta",           phone: "9840045678", type: "average",   riskScore: 28 },
  { name: "Suresh Yadav",          phone: "9850056789", type: "average",   riskScore: 35 },
  { name: "Anita Kumari Singh",    phone: "9860067890", type: "average",   riskScore: 22 },

  // ── Late payers (2) ──────────────────────────────────────────────────────
  { name: "Mohammad Irfan Shaikh", phone: "9870078901", type: "late",      riskScore: 58 },
  { name: "Kavita Rajput",         phone: "9880089012", type: "late",      riskScore: 62 },

  // ── High risk (2) ────────────────────────────────────────────────────────
  { name: "Deepak Nair",           phone: "9890090123", type: "high-risk", riskScore: 78 },
  { name: "Rekha Bose Chatterjee", phone: null,          type: "high-risk", riskScore: 85 },
];

// ---------------------------------------------------------------------------
// buildEntriesForCustomer
// Returns { entries: rawEntryObjects[], totalOwed: number }
// ---------------------------------------------------------------------------

const buildEntriesForCustomer = (customerId, profile) => {
  const entries = [];

  switch (profile.type) {

    // ── Good: always pays on time, low remaining ────────────────────────────
    case "good": {
      const e1 = 1500;
      entries.push({ customerId, amount: e1, type: "credit", status: "paid",
        remainingAmount: 0, dueDate: daysAgo(20), note: "Grocery items",
        createdAt: daysAgo(25), updatedAt: daysAgo(18) });
      entries.push({ customerId, amount: e1, type: "payment", status: "paid",
        remainingAmount: 0, dueDate: null, note: null,
        createdAt: daysAgo(18), updatedAt: daysAgo(18), _creditRef: 0 });

      const e2 = 800;
      entries.push({ customerId, amount: e2, type: "credit", status: "paid",
        remainingAmount: 0, dueDate: daysAgo(5), note: "Household supplies",
        createdAt: daysAgo(10), updatedAt: daysAgo(4) });
      entries.push({ customerId, amount: e2, type: "payment", status: "paid",
        remainingAmount: 0, dueDate: null, note: null,
        createdAt: daysAgo(4), updatedAt: daysAgo(4), _creditRef: 2 });

      const e3 = 2200;
      entries.push({ customerId, amount: e3, type: "credit", status: "pending",
        remainingAmount: e3, dueDate: daysFromNow(10), note: "Festival shopping",
        createdAt: daysAgo(2), updatedAt: daysAgo(2) });

      return { entries, totalOwed: e3 };
    }

    // ── Average: mostly pays, occasional delays ─────────────────────────────
    case "average": {
      const e1 = 3000;
      entries.push({ customerId, amount: e1, type: "credit", status: "paid",
        remainingAmount: 0, dueDate: daysAgo(30), note: "Monthly ration",
        createdAt: daysAgo(35), updatedAt: daysAgo(28) });
      entries.push({ customerId, amount: e1, type: "payment", status: "paid",
        remainingAmount: 0, dueDate: null, note: null,
        createdAt: daysAgo(28), updatedAt: daysAgo(28), _creditRef: 0 });

      const e2 = 1800, e2p = 900;
      entries.push({ customerId, amount: e2, type: "credit", status: "partial",
        remainingAmount: r2(e2 - e2p), dueDate: daysAgo(3), note: "Medicines + groceries",
        createdAt: daysAgo(15), updatedAt: daysAgo(8) });
      entries.push({ customerId, amount: e2p, type: "payment", status: "paid",
        remainingAmount: 0, dueDate: null, note: null,
        createdAt: daysAgo(8), updatedAt: daysAgo(8), _creditRef: 2 });

      const e3 = 1200;
      entries.push({ customerId, amount: e3, type: "credit", status: "pending",
        remainingAmount: e3, dueDate: daysFromNow(7), note: "School supplies",
        createdAt: daysAgo(1), updatedAt: daysAgo(1) });

      const e4 = 650;
      entries.push({ customerId, amount: e4, type: "credit", status: "pending",
        remainingAmount: e4, dueDate: daysAgo(5), note: "Snacks + beverages",
        createdAt: daysAgo(12), updatedAt: daysAgo(12) });

      return { entries, totalOwed: r2((e2 - e2p) + e3 + e4) };
    }

    // ── Late: frequently misses due dates ───────────────────────────────────
    case "late": {
      const e1 = 4000;
      entries.push({ customerId, amount: e1, type: "credit", status: "paid",
        remainingAmount: 0, dueDate: daysAgo(45), note: "Bulk purchase",
        createdAt: daysAgo(60), updatedAt: daysAgo(40) });
      entries.push({ customerId, amount: e1, type: "payment", status: "paid",
        remainingAmount: 0, dueDate: null, note: null,
        createdAt: daysAgo(40), updatedAt: daysAgo(40), _creditRef: 0 });

      const e2 = 2500;
      entries.push({ customerId, amount: e2, type: "credit", status: "pending",
        remainingAmount: e2, dueDate: daysAgo(15), note: "Cooking oil + dal",
        createdAt: daysAgo(25), updatedAt: daysAgo(25) });

      const e3 = 1600, e3p = 400;
      entries.push({ customerId, amount: e3, type: "credit", status: "partial",
        remainingAmount: r2(e3 - e3p), dueDate: daysAgo(8), note: "Miscellaneous items",
        createdAt: daysAgo(20), updatedAt: daysAgo(12) });
      entries.push({ customerId, amount: e3p, type: "payment", status: "paid",
        remainingAmount: 0, dueDate: null, note: null,
        createdAt: daysAgo(12), updatedAt: daysAgo(12), _creditRef: 3 });

      const e4 = 900;
      entries.push({ customerId, amount: e4, type: "credit", status: "pending",
        remainingAmount: e4, dueDate: daysAgo(2), note: "Tea + sugar",
        createdAt: daysAgo(10), updatedAt: daysAgo(10) });

      const e5 = 3200;
      entries.push({ customerId, amount: e5, type: "credit", status: "pending",
        remainingAmount: e5, dueDate: daysFromNow(5), note: "Diwali advance order",
        createdAt: daysAgo(3), updatedAt: daysAgo(3) });

      return { entries, totalOwed: r2(e2 + (e3 - e3p) + e4 + e5) };
    }

    // ── High risk: serial defaulter, minimal payments ───────────────────────
    case "high-risk": {
      const e1 = 5000, e1p = 500;
      entries.push({ customerId, amount: e1, type: "credit", status: "partial",
        remainingAmount: r2(e1 - e1p), dueDate: daysAgo(40), note: "Large grocery order",
        createdAt: daysAgo(55), updatedAt: daysAgo(50) });
      entries.push({ customerId, amount: e1p, type: "payment", status: "paid",
        remainingAmount: 0, dueDate: null, note: null,
        createdAt: daysAgo(50), updatedAt: daysAgo(50), _creditRef: 0 });

      const e2 = 3500;
      entries.push({ customerId, amount: e2, type: "credit", status: "pending",
        remainingAmount: e2, dueDate: daysAgo(30), note: "Electronics accessories",
        createdAt: daysAgo(45), updatedAt: daysAgo(45) });

      const e3 = 2800, e3p = 800;
      entries.push({ customerId, amount: e3, type: "credit", status: "partial",
        remainingAmount: r2(e3 - e3p), dueDate: daysAgo(20), note: "Clothing items",
        createdAt: daysAgo(30), updatedAt: daysAgo(22) });
      entries.push({ customerId, amount: e3p, type: "payment", status: "paid",
        remainingAmount: 0, dueDate: null, note: null,
        createdAt: daysAgo(22), updatedAt: daysAgo(22), _creditRef: 3 });

      const e4 = 1200;
      entries.push({ customerId, amount: e4, type: "credit", status: "pending",
        remainingAmount: e4, dueDate: daysAgo(10), note: "Footwear",
        createdAt: daysAgo(18), updatedAt: daysAgo(18) });

      const e5 = 750;
      entries.push({ customerId, amount: e5, type: "credit", status: "pending",
        remainingAmount: e5, dueDate: daysAgo(3), note: "Snacks bulk",
        createdAt: daysAgo(7), updatedAt: daysAgo(7) });

      const e6 = 4500;
      entries.push({ customerId, amount: e6, type: "credit", status: "pending",
        remainingAmount: e6, dueDate: daysFromNow(3), note: "Monthly advance",
        createdAt: daysAgo(1), updatedAt: daysAgo(1) });

      return {
        entries,
        totalOwed: r2((e1 - e1p) + e2 + (e3 - e3p) + e4 + e5 + e6),
      };
    }

    default:
      return { entries: [], totalOwed: 0 };
  }
};

// ---------------------------------------------------------------------------
// runSeed
// ---------------------------------------------------------------------------

const runSeed = async () => {
  const existing = await Customer.countDocuments();
  if (existing > 0) {
    console.log(`[Seed] Skipped — ${existing} customer(s) already in DB`);
    return false;
  }

  console.log("[Seed] Starting...");

  let totalEntries = 0;

  for (const profile of CUSTOMER_PROFILES) {
    // 1. Create customer
    const customer = await Customer.create({
      name: profile.name, phone: profile.phone,
      riskScore: profile.riskScore, totalOwed: 0,
    });

    // 2. Build raw entry objects
    const { entries: rawEntries, totalOwed } = buildEntriesForCustomer(
      customer._id, profile
    );

    // 3. Insert entries preserving manual timestamps
    const savedIds = [];
    for (const raw of rawEntries) {
      const { _creditRef, ...doc } = raw;   // strip internal helper field
      const result = await Entry.collection.insertOne({
        ...doc,
        customerId: customer._id,
      });
      savedIds.push({ insertedId: result.insertedId, _creditRef });
    }

    // 4. Link payment entries → their credit entry
    for (let i = 0; i < savedIds.length; i++) {
      const { insertedId, _creditRef } = savedIds[i];
      if (typeof _creditRef === "number") {
        const creditMongoId = savedIds[_creditRef].insertedId;
        await Entry.collection.updateOne(
          { _id: insertedId },
          { $set: { linkedEntryId: creditMongoId } }
        );
      }
    }

    // 5. Update customer totalOwed
    await Customer.findByIdAndUpdate(customer._id, { totalOwed });

    totalEntries += savedIds.length;
    console.log(
      `[Seed] ✓ ${profile.name} (${profile.type}) — ` +
      `${savedIds.length} entries, owed ₹${totalOwed}`
    );
  }

  console.log(
    `[Seed] Done — ${CUSTOMER_PROFILES.length} customers, ${totalEntries} entries`
  );
  return true;
};

// ---------------------------------------------------------------------------
// Standalone runner:  node scripts/seedData.js
// ---------------------------------------------------------------------------

if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(appConfig.mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log("[Seed] DB connected");
      await runSeed();
    } catch (err) {
      console.error("[Seed] Error:", err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
      console.log("[Seed] DB disconnected");
    }
  })();
}

module.exports = { runSeed };
