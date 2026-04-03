-- =====================================================
-- Et3am: Fix UUID and Constraints
-- =====================================================

-- First drop the foreign key constraint if exists
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_donor_fkey;
ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_reserved_by_fkey;

-- Fix users table to use proper UUID type
ALTER TABLE users ALTER COLUMN id TYPE UUID USING id::UUID;

-- Fix donations table to use proper UUID type  
ALTER TABLE donations ALTER COLUMN id TYPE UUID USING id::UUID;
ALTER TABLE donations ALTER COLUMN donor_id TYPE UUID USING donor_id::UUID;
ALTER TABLE donations ALTER COLUMN reserved_by TYPE UUID USING reserved_by::UUID;

-- Re-add constraints
ALTER TABLE donations ADD CONSTRAINT donations_donor_fkey 
  FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE;

-- Verify
SELECT 'Fix applied' AS status;