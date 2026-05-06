const mongoose = require('mongoose');

async function connectMongo(uri) {
  if (!uri) {
    throw new Error('MONGO_URI is required');
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = {
  connectMongo,
};
