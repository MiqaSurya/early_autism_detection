-- Migration to update type check constraint in autism_centers table
-- This ensures the constraint is properly set for the four center types

-- First, drop the existing check constraint
ALTER TABLE autism_centers DROP CONSTRAINT IF EXISTS autism_centers_type_check;

-- Add the check constraint with the four center types
ALTER TABLE autism_centers
ADD CONSTRAINT autism_centers_type_check
CHECK (type IN ('diagnostic', 'therapy', 'support', 'education'));

-- Update the type column comment
COMMENT ON COLUMN autism_centers.type IS 'Type of center: diagnostic, therapy, support, education';

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
    tc.table_name = 'autism_centers' 
    AND tc.constraint_type = 'CHECK';
