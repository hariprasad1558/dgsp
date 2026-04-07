const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/recommendation_system';

async function listCollections() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log(`- ${c.name}`));

    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

listCollections();
