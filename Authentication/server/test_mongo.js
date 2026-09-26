const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;

console.log("Testing connection to:", uri.substring(0, 50) + "...");

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Connected successfully to MongoDB!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection error:", err.message);
    process.exit(1);
  });
