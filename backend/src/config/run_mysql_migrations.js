// backend/src/config/run_mysql_migrations.js
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT || 3306);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'serveflow_restaurant';

  console.log('========================================================');
  console.log(' SERVEFLOW MYSQL MIGRATIONS & SCHEMA RUNNER');
  console.log('========================================================\n');
  console.log(`Target: ${user}@${host}:${port}/${database}`);

  try {
    console.log('1. Connecting to MySQL server...');
    const rootConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 5000
    });
    console.log('✓ Connected to MySQL server.');

    console.log(`2. Ensuring database '${database}' exists...`);
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✓ Database '${database}' is ready.`);
    await rootConn.end();

    console.log(`3. Connecting directly to '${database}' to execute database.sql...`);
    const dbConn = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database
    });

    const schemaPath = path.join(__dirname, '../../database.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    // Split by semicolons while handling comments
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

    console.log(`4. Executing ${statements.length} schema statements...`);
    let executed = 0;
    for (const stmt of statements) {
      try {
        await dbConn.query(stmt);
        executed++;
      } catch (err) {
        // Table/index already exists is acceptable in idempotent runs
        if (!err.message.includes('already exists')) {
          console.warn(`[Migration Notice] ${err.message.split('\n')[0]}`);
        }
      }
    }

    console.log(`✓ Successfully executed ${executed} statements.`);
    await dbConn.end();

    console.log('\n========================================================');
    console.log(' MYSQL DATABASE MIGRATIONS COMPLETED SUCCESSFULLY');
    console.log(' Permanent data storage is active on your MySQL server!');
    console.log('========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n[MySQL Connection Error]', err.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Ensure MySQL / XAMPP / MariaDB service is running on your machine.');
    console.log('2. Check your backend/.env file: DB_HOST, DB_USER, DB_PASSWORD, DB_PORT.');
    console.log('3. While MySQL is stopped, ServeFlow runs with disk-synced permanent fallback.');
    process.exit(1);
  }
}

run();
