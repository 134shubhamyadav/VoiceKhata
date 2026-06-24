require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Entry = require('./models/Entry');

async function dump() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voicekhata");
  
  const users = await User.find({});
  console.log("ALL USERS:");
  users.forEach(u => console.log(u.phone, u._id));

  const allEntries = await Entry.find({}).populate('customerId');
  console.log(`\nALL ENTRIES (Count: ${allEntries.length}):`);
  allEntries.forEach(e => {
    console.log(`- ID: ${e._id}, User: ${e.userId}, Type: ${e.type}, Amount: ${e.amount}, Status: ${e.status}, Customer: ${e.customerId?.name}`);
  });

  process.exit(0);
}
dump();
