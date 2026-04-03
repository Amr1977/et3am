-- =====================================================
-- Et3am Food Donation Platform
-- Database Migration: Initial Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'donor', 'recipient', 'admin')),
    can_donate BOOLEAN DEFAULT true,
    can_receive BOOLEAN DEFAULT true,
    phone VARCHAR(20),
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_city VARCHAR(100),
    location_area VARCHAR(100),
    preferred_language VARCHAR(10) DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar')),
    google_id VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_city, location_area);

-- =====================================================
-- DONATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    food_type VARCHAR(50) NOT NULL CHECK (food_type IN ('meat', 'chicken', 'fish', 'vegetables', 'fruits', 'bread', 'rice', 'pasta', 'soup', 'dessert', 'other')),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'portions' CHECK (unit IN ('portions', 'kg', 'items')),
    expiry_date TIMESTAMP WITH TIME ZONE,
    pickup_address TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    pickup_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'completed', 'expired')),
    reserved_by UUID REFERENCES users(id),
    hash_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_food_type ON donations(food_type);
CREATE INDEX IF NOT EXISTS idx_donations_location ON donations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_donations_reserved_by ON donations(reserved_by);

-- Migrations table (idempotent)
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123) - idempotent
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@et3am.com') THEN
        INSERT INTO users (id, name, email, password, role, preferred_language, can_donate, can_receive)
        VALUES (uuid_generate_v4(), 'Admin', 'admin@et3am.com', '$2a$10$.UT7wJrNWXqRBagoh68d9OJSqTsCFc9G.7RBtz6rQC9ztT/dsRBeq', 'admin', 'en', true, true);
    END IF;
END $$;

-- Verify migration
SELECT 'Migration completed successfully' AS status;