const mongoose = require("mongoose");

async function connectDB(uri = process.env.MONGO_URI) {
  await mongoose.connect(uri);
}

async function disconnectDB() {
  await mongoose.connection.close();
}

module.exports = {
  connectDB,
  disconnectDB,
};
