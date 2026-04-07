const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/recommendation_system';

async function checkUsers() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({
      userId: String,
      role: String,
      department: String,
      state: String
    }));

    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);

    const arunachal = await User.findOne({ userId: 'Arunachal Pradesh' });
    if (arunachal) {
      console.log('User "Arunachal Pradesh" found:');
      console.log(JSON.stringify(arunachal, null, 2));
    } else {
      console.log('User "Arunachal Pradesh" NOT found.');
      
      // List some users to see what's there
      const someUsers = await User.find().limit(5);
      console.log('First 5 users in DB:');
      console.log(JSON.stringify(someUsers, null, 2));
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkUsers();
