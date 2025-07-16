-- =============================================================================
-- ADD MISSING COLUMNS TO CENTER_USERS TABLE
-- =============================================================================
-- This script adds latitude and longitude columns if they're missing

-- Check if columns exist and add them if missing
DO $$ 
BEGIN
    -- Add latitude column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'center_users' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE center_users ADD COLUMN latitude DOUBLE PRECISION;
        RAISE NOTICE 'Added latitude column to center_users table';
    ELSE
        RAISE NOTICE 'Latitude column already exists in center_users table';
    END IF;

    -- Add longitude column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'center_users' 
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE center_users ADD COLUMN longitude DOUBLE PRECISION;
        RAISE NOTICE 'Added longitude column to center_users table';
    ELSE
        RAISE NOTICE 'Longitude column already exists in center_users table';
    END IF;
END $$;

-- Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'center_users'
ORDER BY ordinal_position;

-- Check for centers with missing coordinates
SELECT 
    'COORDINATE CHECK' as check_type,
    COUNT(*) as total_centers,
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coordinates,
    COUNT(CASE WHEN latitude IS NULL OR longitude IS NULL THEN 1 END) as missing_coordinates
FROM center_users 
WHERE is_active = true;

-- Show centers missing coordinates
SELECT 
    'CENTERS MISSING COORDINATES' as issue_type,
    center_name,
    email,
    address,
    latitude,
    longitude,
    CASE 
        WHEN latitude IS NULL AND longitude IS NULL THEN 'Both missing'
        WHEN latitude IS NULL THEN 'Latitude missing'
        WHEN longitude IS NULL THEN 'Longitude missing'
        ELSE 'Has coordinates'
    END as coordinate_status
FROM center_users 
WHERE is_active = true
  AND (latitude IS NULL OR longitude IS NULL)
ORDER BY center_name;
