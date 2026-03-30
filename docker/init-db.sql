-- Initialize PostgreSQL database for Tally Integration
-- This script runs automatically when the PostgreSQL container starts

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables (adjust based on your actual database schema)
-- This is a basic structure - modify according to your needs

-- Example: Ledgers table
CREATE TABLE IF NOT EXISTS ledgers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent VARCHAR(255),
    opening_balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example: Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    narration TEXT,
    amount DECIMAL(15,2) NOT NULL,
    ledger_id INTEGER REFERENCES ledgers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ledgers_name ON ledgers(name);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON vouchers(date);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type);

-- Create a user for the application (optional)
-- CREATE USER tally_app WITH PASSWORD 'app_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tally_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tally_app;

-- Insert sample data (optional)
-- INSERT INTO ledgers (name, opening_balance) VALUES 
--     ('Cash Account', 10000.00),
--     ('Bank Account', 50000.00),
--     ('Sales', 0.00);

COMMIT;
