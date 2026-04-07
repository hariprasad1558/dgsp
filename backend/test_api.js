const axios = require('axios');

async function testApi() {
  try {
    // We need a token to call the stats endpoint
    console.log('Logging in as admin...');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin',
      password: 'admin123'
    });
    
    const token = loginRes.data.token;
    console.log('Token received.');

    console.log('Fetching stats...');
    const statsRes = await axios.get('http://localhost:5000/api/recs/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Stats Result:');
    console.log(JSON.stringify(statsRes.data.stats, null, 2));
    console.log('List length:', statsRes.data.list.length);

    if (statsRes.data.list.length === 0) {
      console.log('List is empty! Investigating why...');
      // Check if file exists and can be read by the server
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../frontend/src/data/recommendations.json');
      console.log('Testing file path:', filePath);
      if (fs.existsSync(filePath)) {
        console.log('File EXISTS.');
        const data = fs.readFileSync(filePath, 'utf8');
        console.log('File size:', data.length);
        try {
          const json = JSON.parse(data);
          console.log('JSON parsed successfully. Count:', json.length);
        } catch (e) {
          console.error('JSON parse error:', e.message);
        }
      } else {
        console.error('File DOES NOT EXIST at this path.');
      }
    }
  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}

testApi();
