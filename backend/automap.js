const fs = require('fs');
const path = require('path');
const http = require('http');

// Constants mirroring recommendationUtils.js
const ALL_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal'
];
const ALL_UTS = [
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];
const COASTAL_STATES = ['Andhra Pradesh', 'Goa', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Odisha', 'Tamil Nadu', 'West Bengal'];
const COASTAL_UTS = ['Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep', 'Puducherry'];
const IMB_STATES = ['Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram'];

function expandOfficerToken(token) {
  if (!token) return null;
  let t = token.replace(/^(Actioned? by:?\s*)/i, '').trim();
  const tLower = t.toLowerCase();
  if (tLower.includes('dgsp') && tLower.includes('coastal')) return [...COASTAL_STATES, ...COASTAL_UTS];
  if (tLower.includes('dgsp') && (tLower.includes('concerned') || tLower.includes('arunachal'))) {
    if (tLower.includes('arunachal')) {
      const match = t.match(/\(([^)]+)\)/);
      if (match) return match[1].split(',').map(s => s.trim());
    }
    return IMB_STATES;
  }
  if ((tLower.includes('dgsp') || tLower.includes('dgp') || tLower.includes('dgs p')) && (tLower.includes('state') || tLower.includes('ut') || tLower.includes('union'))) {
    if (tLower.includes('west bengal')) return ['West Bengal'];
    return [...ALL_STATES, ...ALL_UTS];
  }
  if (tLower.includes('dgp west bengal')) return ['West Bengal'];
  const foundState = ALL_STATES.find(s => s.toLowerCase() === tLower);
  if (foundState) return [foundState];
  const foundUT = ALL_UTS.find(u => u.toLowerCase() === tLower);
  if (foundUT) return [foundUT];
  return [t];
}

function getAssignedUsers(actionedByString) {
  if (!actionedByString) return [];
  const rawTokens = actionedByString.split(',').map(s => s.trim());
  const allUsers = new Set();
  rawTokens.forEach(token => {
    const expanded = expandOfficerToken(token);
    if (expanded) expanded.forEach(u => allUsers.add(u));
  });
  return Array.from(allUsers);
}

// Read recommendations.json
const recsPath = path.join(__dirname, '..', 'frontend', 'src', 'data', 'recommendations.json');
const recs = JSON.parse(fs.readFileSync(recsPath, 'utf8'));

// Build entity map
const entityMap = {};
recs.forEach(rec => {
  const entities = getAssignedUsers(rec.actionedBy);
  entities.forEach(entity => {
    if (!entityMap[entity]) entityMap[entity] = [];
    entityMap[entity].push(rec.recNo);
  });
});

const allocations = Object.entries(entityMap).map(([department, rec_ids]) => ({
  department,
  rec_ids: rec_ids.sort((a, b) => a - b)
}));

console.log('Built mapping for ' + allocations.length + ' entities.');

// POST to the bulk-sync endpoint
const body = JSON.stringify({ allocations });
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/recs/allocations/bulk-sync',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.success) {
      console.log('SUCCESS: Auto-mapped ' + result.count + ' entities.');
    } else {
      console.error('FAILED:', data);
    }
  });
});
req.on('error', err => console.error('Request error:', err.message));
req.write(body);
req.end();
