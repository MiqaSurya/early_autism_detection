-- Migration to update center_type check constraint in center_users table
-- This ensures the constraint is properly set for the four center types

-- First, drop the existing check constraint
ALTER TABLE center_users DROP CONSTRAINT IF EXISTS center_users_center_type_check;

-- Add the check constraint with the four center types
ALTER TABLE center_users
ADD CONSTRAINT center_users_center_type_check
CHECK (center_type IN ('diagnostic', 'therapy', 'support', 'education'));

-- Update the center_type column comment
COMMENT ON COLUMN center_users.center_type IS 'Type of center: diagnostic, therapy, support, education';

-- Verify the changes
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    cc.check_clause
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE 
    tc.table_name = 'center_users' 
    AND tc.constraint_type = 'CHECK';
