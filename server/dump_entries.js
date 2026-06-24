require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voicekhata");
  
  const entries = await mongoose.connection.collection('entries').find().toArray();
  if (entries.length > 0) {
    console.log("Type of userId:", typeof entries[0].userId, "Constructor:", entries[0].userId.constructor.name);
    console.log("Type of _id:", typeof entries[0]._id, "Constructor:", entries[0]._id.constructor.name);
  }
  process.exit(0);
}
check();
