const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

async function connectDatabase(url) {
  await mongoose.connect(url);
  return mongoose.connection;
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
