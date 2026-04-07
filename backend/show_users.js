const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/recommendation_system';

async function showUsers() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      userId: String,
      role: String
    }));

    const allUsers = await User.find({}, 'userId role').lean();
    console.log(`Total users in DB: ${allUsers.length}`);
    console.log('User list:');
    allUsers.forEach(u => console.log(`- ${u.userId} (${u.role})`));

    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

showUsers();
