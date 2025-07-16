-- Script to sync all centers from center_users to autism_centers
-- This ensures all centers are properly synced between the two tables

-- First, let's identify centers in center_users that don't exist in autism_centers
WITH missing_centers AS (
  SELECT 
    cu.id,
    cu.center_name,
    cu.center_type,
    cu.address,
    cu.latitude,
    cu.longitude,
    cu.phone,
    cu.email,
    cu.description,
    cu.contact_person,
    cu.business_license,
    cu.is_verified,
    cu.is_active
  FROM 
    center_users cu
  LEFT JOIN 
    autism_centers ac ON cu.id = ac.center_user_id
  WHERE 
    ac.id IS NULL
)

-- Insert missing centers into autism_centers
INSERT INTO autism_centers (
  center_user_id,
  name,
  type,
  address,
  latitude,
  longitude,
  phone,
  email,
  description,
  contact_person,
  business_license,
  is_verified,
  is_active,
  created_at,
  updated_at
)
SELECT 
  id AS center_user_id,
  center_name AS name,
  center_type AS type,
  address,
  latitude,
  longitude,
  phone,
  email,
  description,
  contact_person,
  business_license,
  is_verified,
  is_active,
  NOW() AS created_at,
  NOW() AS updated_at
FROM 
  missing_centers;

-- Now update existing centers to ensure they're in sync
UPDATE autism_centers ac
SET 
  name = cu.center_name,
  type = cu.center_type,
  address = cu.address,
  latitude = cu.latitude,
  longitude = cu.longitude,
  phone = cu.phone,
  email = cu.email,
  description = cu.description,
  contact_person = cu.contact_person,
  business_license = cu.business_license,
  is_verified = cu.is_verified,
  is_active = cu.is_active,
  updated_at = NOW()
FROM 
  center_users cu
WHERE 
  ac.center_user_id = cu.id;

-- Add default services for centers that don't have any
WITH centers_without_services AS (
  SELECT 
    id, 
    type
  FROM 
    autism_centers
  WHERE 
    services IS NULL OR array_length(services, 1) IS NULL
)

UPDATE autism_centers ac
SET services =
  CASE
    WHEN ac.type = 'diagnostic' THEN ARRAY['ADOS-2 Assessment', 'Developmental Evaluation', 'Speech Assessment', 'Psychological Testing']
    WHEN ac.type = 'therapy' THEN ARRAY['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Social Skills Training']
    WHEN ac.type = 'support' THEN ARRAY['Support Groups', 'Family Counseling', 'Resource Navigation', 'Respite Care']
    WHEN ac.type = 'education' THEN ARRAY['Inclusive Classrooms', 'Teacher Training', 'Curriculum Development', 'Parent Education']
    ELSE ARRAY['General Autism Support Services']
  END
FROM 
  centers_without_services cws
WHERE 
  ac.id = cws.id;

-- Add default age groups for centers that don't have any
UPDATE autism_centers
SET age_groups = ARRAY['0-3', '4-7', '8-12', '13-18']
WHERE age_groups IS NULL OR array_length(age_groups, 1) IS NULL;

-- Add default insurance options for centers that don't have any
UPDATE autism_centers
SET insurance_accepted = ARRAY['Private Pay', 'Insurance', 'Medicaid']
WHERE insurance_accepted IS NULL OR array_length(insurance_accepted, 1) IS NULL;

-- Output results
SELECT 'Sync completed. Centers in sync: ' || COUNT(*) AS result
FROM autism_centers
WHERE center_user_id IS NOT NULL;
