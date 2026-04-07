const axios = require('axios');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./models/User');
const Allocation = require('./models/Allocation');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('--- Testing State-Based Filtering ---');

    // 1. Login as Andhra Pradesh user
    console.log('Logging in as Andhra Pradesh...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'Andhra Pradesh',
      password: 'Dgsp@2024'
    });

    const { token, user } = loginRes.data;
    console.log('Login successful. State:', user.state);
    
    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Fetch stats (filtered)
    console.log('Fetching filtered recommendations...');
    const statsRes = await axios.get(`${API_URL}/recs/stats`, config);
    
    console.log('Total recommendations for Andhra Pradesh:', statsRes.data.stats.total);
    
    // 3. Verify against Allocation model
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/recommendation_system';
    await mongoose.connect(mongoURI);
    const allocation = await Allocation.findOne({ department: 'Andhra Pradesh' });
    const assignedIds = allocation ? allocation.rec_ids : [];
    
    console.log('Expected count from Allocation model:', assignedIds.length);

    if (statsRes.data.stats.total === assignedIds.length) {
      console.log('✅ SUCCESS: Dashboard filtering works as expected!');
    } else {
      console.log('❌ FAILURE: Dashboard filtering mismatch!');
    }

    mongoose.connection.close();
  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

test();
