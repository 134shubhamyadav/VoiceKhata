require('dotenv').config();
const mongoose = require('mongoose');
const Entry = require('./models/Entry');
const Customer = require('./models/Customer');
const { getDashboardSummaryData } = require('./services/dashboardService');

async function dump() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voicekhata");
  
  // Find the first user or let's dump all entries that match the user's description
  // They said 3000 was outstanding from 2 person. Let's find entries with 3000 or 2000.
  const entries = await Entry.find({ amount: { $in: [3000, 2000] } }).populate('customerId');
  console.log("ENTRIES WITH 3000 or 2000:");
  entries.forEach(e => {
    console.log(`- Type: ${e.type}, Amount: ${e.amount}, Status: ${e.status}, Customer: ${e.customerId?.name}, Note: ${e.note}, Date: ${e.createdAt}`);
  });

  // Let's get the dashboard summary data for the user of the first entry
  if (entries.length > 0) {
    const userId = entries[0].userId;
    console.log("\nUSER ID:", userId);
    
    // Check all entries for this user
    const allEntries = await Entry.find({ userId }).populate('customerId');
    console.log(`\nALL ENTRIES FOR USER (Count: ${allEntries.length}):`);
    allEntries.forEach(e => {
      console.log(`- ID: ${e._id}, Type: ${e.type}, Amount: ${e.amount}, Status: ${e.status}, Customer: ${e.customerId?.name}, Note: ${e.note}`);
    });

    const summary = await getDashboardSummaryData(userId);
    console.log("\nDASHBOARD SUMMARY:");
    console.log(summary);
  } else {
    console.log("No matching entries found.");
  }

  process.exit(0);
}
dump();
