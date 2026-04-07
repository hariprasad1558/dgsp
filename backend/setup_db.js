const fs = require('fs');
const { Client } = require('pg');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const envPath = path.join(__dirname, '.env');

rl.question('Please enter your PostgreSQL password for user "postgres": ', async (password) => {
    console.log('Testing connection...');
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'postgres',
        password: password,
        port: 5432,
    });

    try {
        await client.connect();
        console.log('Connection successful!');

        // Check if database exists
        const dbRes = await client.query("SELECT 1 FROM pg_database WHERE datname = 'policegpt'");
        if (dbRes.rowCount === 0) {
            console.log('Database "policegpt" does not exist. Creating it...');
            await client.query('CREATE DATABASE policegpt');
            console.log('Database created successfully.');
        } else {
            console.log('Database "policegpt" already exists.');
        }

        await client.end();

        // Now connect to the new DB to create tables
        const dbClient = new Client({
            user: 'postgres',
            host: 'localhost',
            database: 'policegpt',
            password: password,
            port: 5432,
        });

        await dbClient.connect();
        console.log('Connected to "policegpt" database.');

        // Create recommendations table based on routes/recs.js
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS recommendations (
        id VARCHAR(255) PRIMARY KEY,
        recno SERIAL,
        status VARCHAR(50) DEFAULT 'Pending',
        details TEXT,
        data JSONB,
        last_updated_by VARCHAR(255)
      );
    `;
        await dbClient.query(createTableQuery);
        console.log('Tables initialized successfully.');

        await dbClient.end();

        // Update .env file
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(
                /DATABASE_URL=.*/g,
                `DATABASE_URL=postgresql://postgres:${password}@localhost:5432/policegpt`
            );
            fs.writeFileSync(envPath, envContent);
            console.log('Successfully updated .env file with the correct password.');
        } else {
            console.log('.env file not found at ' + envPath);
        }
    } catch (err) {
        if (err.message.includes('password authentication failed')) {
            console.error('Error: Password authentication failed. The password you entered is incorrect.');
        } else {
            console.error('An error occurred:', err.message);
        }
    } finally {
        rl.close();
    }
});
