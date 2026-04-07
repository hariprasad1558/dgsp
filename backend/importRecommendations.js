const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'policegpt',
  password: 'your_password',
  port: 5432,
});

async function importRecommendations() {
  const filePath = path.join(__dirname, '../frontend/src/data/recommendations.json');
  const recommendations = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const rec of recommendations) {
    const {
      id,
      recNo,
      recommendation,
      actionedBy,
      category,
      tableFields
    } = rec;
    try {
      await pool.query(
        `INSERT INTO recommendations (recno, recommendation, actionedby, category, tablefields, status, details, data, last_updated_by)
         VALUES ($1, $2, $3, $4, $5, 'Pending', '', '{}', '') ON CONFLICT (recno) DO NOTHING`,
        [recNo, recommendation, actionedBy, category, JSON.stringify(tableFields || [])]
      );
      console.log(`Inserted recommendation ${recNo}`);
    } catch (err) {
      console.error(`Error inserting rec ${recNo}:`, err);
    }
  }
  await pool.end();
  console.log('Import complete.');
}

importRecommendations();