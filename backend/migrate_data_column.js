require('dotenv').config();
const pool = require('./db');

async function migrate() {
  try {
    console.log('Checking for existing columns...');
    const [columns] = await pool.query('SHOW COLUMNS FROM recommendations');
    const existingColumns = columns.map(c => c.Field);

    if (!existingColumns.includes('data')) {
      console.log('Adding data column...');
      await pool.query('ALTER TABLE recommendations ADD COLUMN data JSON');
    }
    
    if (!existingColumns.includes('last_updated_by')) {
      console.log('Adding last_updated_by column...');
      await pool.query('ALTER TABLE recommendations ADD COLUMN last_updated_by VARCHAR(255)');
    }

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
