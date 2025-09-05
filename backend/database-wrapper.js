// Database wrapper that selects SQLite or PostgreSQL based on configuration
require('dotenv').config();

// Determine which database to use
const dbType = process.env.DB_TYPE || 'sqlite';

let database;

if (dbType === 'postgres' || process.env.DATABASE_URL) {
    console.log('Using PostgreSQL database');
    database = require('./database-pg');
} else {
    console.log('Using SQLite database');
    database = require('./database');
}

module.exports = database;