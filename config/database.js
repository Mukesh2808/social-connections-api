// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'social_connections',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum number of clients in pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
});

// Connection event handlers
pool.on('connect', (client) => {
    console.log('✅ New client connected to PostgreSQL');
});

pool.on('error', (err, client) => {
    console.error('❌ Unexpected error on idle client:', err);
    process.exit(-1);
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, version() as db_version');
        console.log('🔗 Database connection successful:');
        console.log('   Time:', result.rows[0].current_time);
        console.log('   Version:', result.rows[0].db_version.split(' ')[0] + ' ' + result.rows[0].db_version.split(' ')[1]);
        client.release();
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return false;
    }
};

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🔄 Shutting down gracefully...');
    pool.end(() => {
        console.log('📊 Database pool has ended');
        process.exit(0);
    });
});

module.exports = {
    pool,
    testConnection
};
