require('dotenv').config();
const pool = require('./db');

async function verifyTables() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log('Tables in dgsp_portal:');
    const tableNames = rows.map(row => Object.values(row)[0]);
    console.log(tableNames.join(', '));
    
    for (const tableName of tableNames) {
      const [schema] = await pool.query(`DESCRIBE ${tableName}`);
      console.log(`\nStructure of ${tableName}:`);
      console.table(schema);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  }
}

verifyTables();
