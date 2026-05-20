const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    multipleStatements: true
  };
  if (process.env.DB_PASSWORD !== undefined && String(process.env.DB_PASSWORD).trim() !== '') {
    config.password = process.env.DB_PASSWORD;
  }

  console.log('🔧 Database config:', {
    host: config.host,
    port: config.port,
    user: config.user,
    hasPassword: !!config.password
  });

  try {
    console.log('🔌 Connecting to MySQL server...');
    const connection = await mysql.createConnection(config);

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'cottoniq_db';
    console.log(`📦 Creating database: ${dbName}`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Use the database
    await connection.query(`USE ${dbName}`);

    // Read and execute the schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'mysql_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🏗️  Creating tables and inserting initial data...');
    await connection.query(schema);

    console.log('✅ Database setup completed successfully!');
    console.log(`📊 Database: ${dbName}`);
    console.log('🎯 Tables created: products, inquiries, content_sections');
    console.log('📝 Sample data inserted');

    await connection.end();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();