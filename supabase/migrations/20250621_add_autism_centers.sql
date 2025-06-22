-- Migration: Add autism_centers table for locator functionality
-- Created: 2025-06-21

-- Create autism_centers table for pre-populated treatment centers
CREATE TABLE IF NOT EXISTS autism_centers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('diagnostic', 'therapy', 'support', 'education')) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  website TEXT,
  email TEXT,
  description TEXT,
  services TEXT[], -- Array of services offered
  age_groups TEXT[], -- Array of age groups served
  insurance_accepted TEXT[], -- Array of insurance types
  rating DECIMAL(2,1), -- Rating out of 5
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on autism_centers (read-only for all users)
ALTER TABLE autism_centers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read autism centers
CREATE POLICY "Anyone can view autism centers"
  ON autism_centers
  FOR SELECT
  USING (true);

-- Create policy to allow only authenticated users to insert (for admin functionality)
CREATE POLICY "Authenticated users can insert autism centers"
  ON autism_centers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS autism_centers_location_idx 
  ON autism_centers (latitude, longitude);

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS autism_centers_type_idx 
  ON autism_centers (type);

-- Insert sample data
INSERT INTO autism_centers (
  name, type, address, latitude, longitude, phone, website, email, 
  description, services, age_groups, insurance_accepted, rating, verified
) VALUES 
-- Diagnostic Centers
(
  'Children''s Autism Diagnostic Center',
  'diagnostic',
  '123 Medical Plaza, New York, NY 10001',
  40.7589, -73.9851,
  '(555) 123-4567',
  'https://example-autism-center.com',
  'info@example-autism-center.com',
  'Comprehensive autism diagnostic services for children and adolescents',
  ARRAY['ADOS-2 Assessment', 'Developmental Evaluation', 'Speech Assessment', 'Occupational Therapy Evaluation'],
  ARRAY['0-3', '4-7', '8-12', '13-18'],
  ARRAY['Medicaid', 'Blue Cross', 'Aetna', 'Private Pay'],
  4.5,
  true
),
(
  'Metro Developmental Assessment Center',
  'diagnostic',
  '456 Health Street, Los Angeles, CA 90210',
  34.0522, -118.2437,
  '(555) 234-5678',
  'https://metro-dev-center.com',
  'contact@metro-dev-center.com',
  'Early intervention and diagnostic services',
  ARRAY['Early Intervention', 'ADOS Assessment', 'Psychological Testing'],
  ARRAY['0-3', '4-7'],
  ARRAY['Medicaid', 'Kaiser', 'Private Pay'],
  4.2,
  true
),

-- Therapy Centers
(
  'Bright Futures Therapy Center',
  'therapy',
  '789 Therapy Lane, Chicago, IL 60601',
  41.8781, -87.6298,
  '(555) 345-6789',
  'https://bright-futures-therapy.com',
  'hello@bright-futures-therapy.com',
  'ABA therapy and behavioral intervention services',
  ARRAY['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Social Skills Groups'],
  ARRAY['4-7', '8-12', '13-18'],
  ARRAY['Medicaid', 'BCBS', 'UnitedHealth', 'Private Pay'],
  4.7,
  true
),
(
  'Spectrum Support Services',
  'therapy',
  '321 Wellness Blvd, Houston, TX 77001',
  29.7604, -95.3698,
  '(555) 456-7890',
  'https://spectrum-support.com',
  'info@spectrum-support.com',
  'Comprehensive therapy services for autism spectrum disorders',
  ARRAY['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Physical Therapy', 'Music Therapy'],
  ARRAY['0-3', '4-7', '8-12', '13-18'],
  ARRAY['Medicaid', 'Aetna', 'Cigna', 'Private Pay'],
  4.3,
  true
),

-- Support Groups
(
  'Autism Family Support Network',
  'support',
  '654 Community Center Dr, Phoenix, AZ 85001',
  33.4484, -112.0740,
  '(555) 567-8901',
  'https://autism-family-support.org',
  'support@autism-family-support.org',
  'Support groups and resources for families affected by autism',
  ARRAY['Parent Support Groups', 'Sibling Support', 'Family Counseling', 'Resource Navigation'],
  ARRAY['0-3', '4-7', '8-12', '13-18'],
  ARRAY['Free', 'Sliding Scale'],
  4.8,
  true
),
(
  'Spectrum Families United',
  'support',
  '987 Hope Street, Philadelphia, PA 19101',
  39.9526, -75.1652,
  '(555) 678-9012',
  'https://spectrum-families-united.org',
  'connect@spectrum-families-united.org',
  'Community support and advocacy for autism families',
  ARRAY['Support Groups', 'Advocacy Training', 'Community Events', 'Respite Care'],
  ARRAY['0-3', '4-7', '8-12', '13-18'],
  ARRAY['Free', 'Donations Welcome'],
  4.6,
  true
),

-- Educational Resources
(
  'Autism Learning Academy',
  'education',
  '147 Education Way, Seattle, WA 98101',
  47.6062, -122.3321,
  '(555) 789-0123',
  'https://autism-learning-academy.edu',
  'admissions@autism-learning-academy.edu',
  'Specialized educational programs for students with autism',
  ARRAY['Special Education', 'Individualized Learning Plans', 'Transition Services', 'Life Skills Training'],
  ARRAY['4-7', '8-12', '13-18'],
  ARRAY['Public Funding', 'Private Pay', 'Scholarships Available'],
  4.4,
  true
),
(
  'Inclusive Education Center',
  'education',
  '258 Learning Circle, Miami, FL 33101',
  25.7617, -80.1918,
  '(555) 890-1234',
  'https://inclusive-education-center.org',
  'info@inclusive-education-center.org',
  'Inclusive educational programs and teacher training',
  ARRAY['Inclusive Classrooms', 'Teacher Training', 'Curriculum Development', 'Parent Education'],
  ARRAY['0-3', '4-7', '8-12', '13-18'],
  ARRAY['Public Funding', 'Grants', 'Private Pay'],
  4.1,
  true
);
