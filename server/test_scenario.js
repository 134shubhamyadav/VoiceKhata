require('dotenv').config();
const mongoose = require('mongoose');
const { getDashboardSummaryData } = require('./services/dashboardService');
const Entry = require('./models/Entry');
const Customer = require('./models/Customer');
const { selfHealCustomerBalances } = require('./controllers/entryController');

async function testScenario() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voicekhata");
  const userId = new mongoose.Types.ObjectId();

  // Create Person 1
  const person1 = await Customer.create({ userId, name: "Person 1", totalOwed: 0, riskScore: "low" });
  await Entry.create({ userId, customerId: person1._id, amount: 1000, type: "credit", status: "pending", remainingAmount: 1000 });
  await Entry.create({ userId, customerId: person1._id, amount: 3000, type: "payment", status: "paid", remainingAmount: 0 });
  await Entry.create({ userId, customerId: person1._id, amount: 2000, type: "credit", status: "pending", remainingAmount: 2000 });
  await selfHealCustomerBalances(person1._id);

  // Create Person 2
  const person2 = await Customer.create({ userId, name: "Person 2", totalOwed: 0, riskScore: "low" });
  await Entry.create({ userId, customerId: person2._id, amount: 2000, type: "credit", status: "pending", remainingAmount: 2000 });
  await Entry.create({ userId, customerId: person2._id, amount: 2000, type: "payment", status: "paid", remainingAmount: 0 });
  await selfHealCustomerBalances(person2._id);

  const data = await getDashboardSummaryData(userId.toString());
  console.log("DASHBOARD DATA:", data);

  process.exit(0);
}
testScenario();
