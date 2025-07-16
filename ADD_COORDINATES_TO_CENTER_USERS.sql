-- =============================================================================
-- ADD LATITUDE AND LONGITUDE TO CENTER USERS TABLE
-- =============================================================================
-- Run this SQL in your Supabase SQL Editor to add location fields

-- Step 1: Add latitude and longitude columns to center_users table
ALTER TABLE center_users
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Step 2: Add constraints to ensure valid coordinate ranges
-- (Run these separately if there are any issues)
ALTER TABLE center_users
ADD CONSTRAINT check_latitude_range CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE center_users
ADD CONSTRAINT check_longitude_range CHECK (longitude >= -180 AND longitude <= 180);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_center_users_location ON center_users(latitude, longitude);

-- Add comments
COMMENT ON COLUMN center_users.latitude IS 'Latitude coordinate of the center location';
COMMENT ON COLUMN center_users.longitude IS 'Longitude coordinate of the center location';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'center_users' 
AND column_name IN ('latitude', 'longitude');
