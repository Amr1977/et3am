-- =====================================================
-- Et3am Development Projects Platform
-- Database Migration: Projects Table
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('education', 'health', 'infrastructure', 'environment', 'social', 'technology', 'other')),
    target_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    raised_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    location_city VARCHAR(100),
    location_area VARCHAR(100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(location_city, location_area);

-- =====================================================
-- PROJECT DONATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_donations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_donations_project ON project_donations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_donations_donor ON project_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_project_donations_status ON project_donations(payment_status);

-- Verify migration
SELECT 'Projects migration completed successfully' AS status;
