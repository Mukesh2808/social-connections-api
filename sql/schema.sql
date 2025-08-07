-- sql/schema.sql

-- Drop existing tables (for clean setup)
DROP TABLE IF EXISTS connections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    internal_db_id SERIAL PRIMARY KEY,
    user_str_id VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create connections table
CREATE TABLE connections (
    id SERIAL PRIMARY KEY,
    user1_str_id VARCHAR(50) NOT NULL,
    user2_str_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique connections and consistent ordering
    UNIQUE(user1_str_id, user2_str_id),
    
    -- Foreign key constraints
    FOREIGN KEY (user1_str_id) REFERENCES users(user_str_id) ON DELETE CASCADE,
    FOREIGN KEY (user2_str_id) REFERENCES users(user_str_id) ON DELETE CASCADE,
    
    -- Ensure consistent ordering (smaller string ID comes first)
    CHECK (user1_str_id < user2_str_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_str_id ON users(user_str_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_connections_user1 ON connections(user1_str_id);
CREATE INDEX idx_connections_user2 ON connections(user2_str_id);
CREATE INDEX idx_connections_pair ON connections(user1_str_id, user2_str_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO users (user_str_id, display_name, email) VALUES 
('alice', 'Alice Wonderland', 'alice@example.com'),
('bob', 'Bob Builder', 'bob@example.com'),
('charlie', 'Charlie Brown', 'charlie@example.com');
