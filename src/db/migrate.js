/**
 * src/db/migrate.js
 *
 * Database migration script for the Tally Integration Project
 * =========================================================
 * This script sets up the database schema and runs any pending migrations.
 * It's designed to be idempotent - running it multiple times won't cause issues.
 */

'use strict';

require('dotenv').config();
const { Pool } = require('pg');
const config = require('../config');

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || config.database?.url || 'postgresql://postgres:password@localhost:5432/tally_integration',
  ssl: false,
  sslmode: 'disable',
  application_name: 'tally_integration'
});

/**
 * Migration table to track which migrations have been run
 */
const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Cache table for storing Tally API responses
 * This provides persistence for cached data across server restarts
 */
const CACHE_TABLE = `
CREATE TABLE IF NOT EXISTS cache (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient cleanup of expired cache entries
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);
`;

/**
 * API usage tracking table (optional but useful for monitoring)
 */
const API_USAGE_TABLE = `
CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  api_key VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  request_size INTEGER,
  response_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for querying usage statistics
CREATE INDEX IF NOT EXISTS idx_api_usage_api_key ON api_usage(api_key);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint);
`;

/**
 * Tally connection logs for debugging and monitoring
 */
const TALLY_CONNECTION_LOGS_TABLE = `
CREATE TABLE IF NOT EXISTS tally_connection_logs (
  id SERIAL PRIMARY KEY,
  tally_host VARCHAR(255) NOT NULL,
  tally_port INTEGER NOT NULL,
  company VARCHAR(255),
  request_type VARCHAR(100),
  success BOOLEAN NOT NULL,
  error_message TEXT,
  response_time_ms INTEGER,
  xml_request_size INTEGER,
  xml_response_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for connection monitoring
CREATE INDEX IF NOT EXISTS idx_tally_logs_success ON tally_connection_logs(success);
CREATE INDEX IF NOT EXISTS idx_tally_logs_created_at ON tally_connection_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_tally_logs_host_port ON tally_connection_logs(tally_host, tally_port);
`;

/**
 * List of all migrations to run
 * Each migration has a name and the SQL to execute
 */
const migrations = [
  {
    name: '001_create_migrations_table',
    sql: MIGRATIONS_TABLE,
  },
  {
    name: '002_create_cache_table',
    sql: CACHE_TABLE,
  },
  {
    name: '003_create_api_usage_table',
    sql: API_USAGE_TABLE,
  },
  {
    name: '004_create_tally_connection_logs_table',
    sql: TALLY_CONNECTION_LOGS_TABLE,
  },
];

/**
 * Check if a migration has already been executed
 * @param {string} migrationName - Name of the migration to check
 * @returns {Promise<boolean>} True if migration has been executed
 */
async function isMigrationExecuted(migrationName) {
  const result = await pool.query(
    'SELECT 1 FROM migrations WHERE name = $1',
    [migrationName]
  );
  return result.rows.length > 0;
}

/**
 * Mark a migration as executed
 * @param {string} migrationName - Name of the migration to mark
 */
async function markMigrationExecuted(migrationName) {
  await pool.query(
    'INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
    [migrationName]
  );
}

/**
 * Execute a single migration
 * @param {object} migration - Migration object with name and sql
 */
async function executeMigration(migration) {
  console.log(`🔄 Running migration: ${migration.name}`);
  
  try {
    await pool.query('BEGIN');
    
    // Execute the migration SQL
    await pool.query(migration.sql);
    
    // Mark the migration as executed
    await markMigrationExecuted(migration.name);
    
    await pool.query('COMMIT');
    console.log(`✅ Migration ${migration.name} completed successfully`);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(`❌ Migration ${migration.name} failed:`, error.message);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // First, ensure the migrations table exists
    await pool.query(MIGRATIONS_TABLE);
    
    // Check and run each migration
    for (const migration of migrations) {
      const executed = await isMigrationExecuted(migration.name);
      
      if (!executed) {
        await executeMigration(migration);
      } else {
        console.log(`⏭️  Migration ${migration.name} already executed, skipping`);
      }
    }
    
    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

/**
 * Clean up expired cache entries
 * This can be run periodically to keep the cache table clean
 */
async function cleanupExpiredCache() {
  console.log('🧹 Cleaning up expired cache entries...');
  
  try {
    const result = await pool.query(
      'DELETE FROM cache WHERE expires_at < NOW()'
    );
    
    console.log(`🗑️  Deleted ${result.rowCount} expired cache entries`);
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error.message);
  }
}

/**
 * Get migration status
 */
async function getMigrationStatus() {
  try {
    const result = await pool.query(
      'SELECT name, executed_at FROM migrations ORDER BY executed_at'
    );
    
    console.log('\n📊 Migration Status:');
    console.log('====================');
    
    if (result.rows.length === 0) {
      console.log('No migrations have been executed yet.');
    } else {
      result.rows.forEach(row => {
        console.log(`✅ ${row.name} - ${row.executed_at.toISOString()}`);
      });
    }
    
    const pending = migrations.filter(m => 
      !result.rows.some(r => r.name === m.name)
    );
    
    if (pending.length > 0) {
      console.log('\n⏳ Pending migrations:');
      pending.forEach(m => console.log(`⏭️  ${m.name}`));
    } else {
      console.log('\n🎉 All migrations are up to date!');
    }
  } catch (error) {
    console.error('❌ Failed to get migration status:', error.message);
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
      await runMigrations();
      break;
    case 'status':
      await getMigrationStatus();
      break;
    case 'cleanup':
      await cleanupExpiredCache();
      break;
    default:
      console.log('Usage:');
      console.log('  node migrate.js up       - Run pending migrations');
      console.log('  node migrate.js status   - Show migration status');
      console.log('  node migrate.js cleanup  - Clean expired cache entries');
      process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down...');
  await pool.end();
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  getMigrationStatus,
  cleanupExpiredCache,
  pool,
};
