-- =============================================================================
-- ADD LATITUDE AND LONGITUDE TO CENTER USERS TABLE
-- =============================================================================
-- This migration adds latitude and longitude columns to the center_users table
-- for location-based functionality

-- Add latitude and longitude columns to center_users table
ALTER TABLE center_users 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add constraints to ensure valid coordinate ranges
ALTER TABLE center_users 
ADD CONSTRAINT check_latitude_range CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT check_longitude_range CHECK (longitude >= -180 AND longitude <= 180);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_center_users_location ON center_users(latitude, longitude);

-- Add comments
COMMENT ON COLUMN center_users.latitude IS 'Latitude coordinate of the center location';
COMMENT ON COLUMN center_users.longitude IS 'Longitude coordinate of the center location';
