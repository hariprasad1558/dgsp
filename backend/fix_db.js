const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/recommendation_system';

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const unionTerritories = [
  'Andaman and Nicobar Islands', 'Chandigarh', 
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const organizations = [
  'AAI', 'Assam Rifles', 'BCAS', 'BPR&D', 'BSF', 'CAPFs', 'CAPFs/CPOs',
  'CBDT', 'CBI', 'CISF', 'CPOs', 'DGs of CAPFs/CPOs', 'ED', 'FIU-IND',
  'FS CD & HG', 'I4C', 'IB', 'ITBP', 'NATGRID', 'NCB', 'NCRB', 'NDRF',
  'NFSU', 'NIA', 'NTRO', 'R&AW', 'SSB', 'SVPNPA'
];

const ministries = [
  'MEA', 'MHA', 'MOD', 'MoF', 'MORTH', 'MeitY',
  'Ministry of Corporate Affairs', 'Ministry of Education',
  'Ministry of Finance', 'Ministry of Health & Family Welfare',
  'Ministry of I&B', 'Ministry of Labour', 'Ministry of Law & Justice',
  'Ministry of Ports, Shipping & Waterways',
  'Ministry of Social Justice & Empowerment', 'Ministry of Tourism',
  'Ministry of Tribal Affairs', 'Ministry of Women & Child Development',
  'Ministry of Youth Affairs & Sports'
];

const defaultPassword = 'Dgsp@2024';

async function fixAndSeed() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB...');

    // Drop the collection to clear ALL data AND incorrect indexes
    try {
      await mongoose.connection.db.dropCollection('users');
      console.log('Dropped "users" collection (cleared old indices).');
    } catch (e) {
      if (e.codeName === 'NamespaceNotFound') {
        console.log('"users" collection not found, nothing to drop.');
      } else {
        throw e;
      }
    }

    const allEntities = [
      ...states.map(s => ({ userId: s, department: s })),
      ...unionTerritories.map(ut => ({ userId: ut, department: ut })),
      ...organizations.map(o => ({ userId: o, department: o })),
      ...ministries.map(m => ({ userId: m, department: m }))
    ];

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const adminPassword = await bcrypt.hash('admin123', 10);

    const userDocs = allEntities.map(entity => ({
      userId: entity.userId,
      password: hashedPassword,
      role: 'user',
      department: entity.department,
      state: entity.department
    }));

    // Add Admin accounts
    userDocs.push({
      userId: 'admin',
      password: adminPassword,
      role: 'admin',
      department: 'Admin'
    });
    userDocs.push({
      userId: 'admin1',
      password: adminPassword,
      role: 'admin',
      department: 'Admin'
    });

    await User.insertMany(userDocs);
    console.log(`Successfully seeded ${userDocs.length} users.`);

    mongoose.connection.close();
    console.log('Done.');
  } catch (err) {
    console.error('Fix error:', err);
    process.exit(1);
  }
}

fixAndSeed();
