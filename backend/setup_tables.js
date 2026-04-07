require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function setupTables() {
  try {
    const sqlPath = path.join(__dirname, 'create_tables_123.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements
    // This is simple splitting by semicolon, might need more care if semicolons are in strings
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('Starting table creation...');

    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('use ')) continue; // Skip USE command in node pool
      await pool.query(statement);
      console.log('Executed:', statement.split('\n')[0].substring(0, 50) + '...');
    }

    console.log('All tables created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error.message);
    process.exit(1);
  }
}

setupTables();
