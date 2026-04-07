const pool = require('./db');

async function fixDb() {
  try {
    await pool.query(`ALTER TABLE recommendations ADD COLUMN status VARCHAR(255) DEFAULT 'Pending'`);
    console.log("Added status");
  } catch (e) {
    console.log("Status column might exist: ", e.message);
  }
  
  try {
    await pool.query(`ALTER TABLE recommendations ADD COLUMN details TEXT`);
    console.log("Added details");
  } catch (e) {
    console.log("Details column might exist: ", e.message);
  }

  try {
    await pool.query(`ALTER TABLE recommendations ADD COLUMN data JSONB`);
    console.log("Added data");
  } catch (e) {
    console.log("Data column might exist: ", e.message);
  }

  try {
    await pool.query(`ALTER TABLE recommendations ADD COLUMN last_updated_by VARCHAR(255)`);
    console.log("Added last_updated_by");
  } catch (e) {
    console.log("last_updated_by column might exist: ", e.message);
  }

  process.exit(0);
}

fixDb();
