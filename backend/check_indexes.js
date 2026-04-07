const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/recommendation_system';

async function checkIndexes() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    const indexes = await mongoose.connection.db.collection('users').indexes();
    console.log('Indexes on "users" collection:');
    console.log(JSON.stringify(indexes, null, 2));

    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkIndexes();
