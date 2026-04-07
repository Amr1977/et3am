-- Fix: Add 'received' to donations status constraint to support mark-received functionality
-- This migration adds 'received' to the allowed statuses

DO $$
BEGIN
    -- Drop existing constraint and add one that includes 'received'
    ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_status_check;
    ALTER TABLE donations ADD CONSTRAINT donations_status_check 
        CHECK (status IN ('available', 'reserved', 'received', 'completed', 'expired'));
END $$;