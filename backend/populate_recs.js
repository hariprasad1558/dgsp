require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function populateRecs() {
  try {
    const jsonPath = path.join(__dirname, '../frontend/src/data/recommendations.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('JSON file not found at:', jsonPath);
        process.exit(1);
    }
    const recommendations = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    console.log('Ensuring recommendations table exists...');
    // Match the schema from setup_db.js
    await pool.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id VARCHAR(255) PRIMARY KEY,
        recno SERIAL,
        status VARCHAR(50) DEFAULT 'Pending',
        details TEXT,
        data JSONB,
        last_updated_by VARCHAR(255)
      );
    `);

    console.log(`Checking and populating ${recommendations.length} recommendations...`);
    
    // Get existing IDs
    const existingRes = await pool.query('SELECT id FROM recommendations');
    const existingIds = new Set(existingRes.rows.map(r => String(r.id)));

    const insertQuery = `
      INSERT INTO recommendations (id, status, details, last_updated_by) 
      VALUES ($1, $2, $3, $4)
    `;

    let count = 0;
    for (const rec of recommendations) {
      if (existingIds.has(String(rec.id))) {
        continue;
      }

      await pool.query(insertQuery, [
        String(rec.id),
        'Pending',
        'Recommendation initialised.',
        ''
      ]);
      count++;
    }

    console.log(`Successfully added ${count} new recommendations to the database.`);
    process.exit(0);
  } catch (error) {
    console.error('Error populating database:', error);
    process.exit(1);
  }
}

populateRecs();
