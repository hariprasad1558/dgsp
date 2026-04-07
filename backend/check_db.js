const mongoose = require('./db');
const Recommendation = require('./models/Recommendation');

async function check() {
  await mongoose;
  const rec = await Recommendation.findOne({ recno: 2 });
  const fs = require('fs');
  fs.writeFileSync('db_output.json', JSON.stringify(rec.toObject(), null, 2));
  process.exit(0);
}

check();
