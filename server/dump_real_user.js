require('dotenv').config();
const mongoose = require('mongoose');
const Entry = require('./models/Entry');
const Customer = require('./models/Customer');
const { getDashboardSummaryData } = require('./services/dashboardService');

async function dump() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voicekhata");
  
  const userId = new mongoose.Types.ObjectId("60b9b32b9b1d8e2df8a149f1");
  console.log("USER ID:", userId);
  
  const allEntries = await Entry.find({ userId }).populate('customerId');
  console.log(`\nALL ENTRIES FOR USER (Count: ${allEntries.length}):`);
  allEntries.forEach(e => {
    console.log(`- ID: ${e._id}, Type: ${e.type}, Amount: ${e.amount}, Status: ${e.status}, Customer: ${e.customerId?.name}, Note: ${e.note}`);
  });

  const summary = await getDashboardSummaryData(userId);
  console.log("\nDASHBOARD SUMMARY:");
  console.log(summary);

  process.exit(0);
}
dump();
