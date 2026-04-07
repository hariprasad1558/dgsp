require('dotenv').config();
const mongoose = require('mongoose');


const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/recommendation_system';
mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
	console.log('Connected to MongoDB');
});

module.exports = mongoose;