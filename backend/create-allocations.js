const pool = require('./db');

async function createAllocationsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS allocations (
        id SERIAL PRIMARY KEY,
        department VARCHAR(255) NOT NULL,
        rec_ids INT[] NOT NULL,
        month VARCHAR(50) NOT NULL,
        UNIQUE(department, month)
      )
    `);
    console.log("Allocations table created successfully (or already exists).");
  } catch (e) {
    console.error("Error creating allocations table: ", e.message);
  }
  process.exit(0);
}

createAllocationsTable();
