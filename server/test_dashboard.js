require('dotenv').config();
const mongoose = require('mongoose');
const { getDashboardSummaryData } = require('./services/dashboardService');

async function check() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voicekhata");
  
  try {
    const data = await getDashboardSummaryData("60b9b32b9b1d8e2df8a149f1");
    console.log("Dashboard Data:", data);
  } catch(e) {
    console.error("Error:", e);
  }
  
  process.exit(0);
}
check();
