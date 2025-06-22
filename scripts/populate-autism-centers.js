// Script to populate autism centers in your Supabase database
// Run this with: node scripts/populate-autism-centers.js

const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sampleCenters = [
  {
    name: 'Children\'s Autism Diagnostic Center',
    type: 'diagnostic',
    address: '123 Medical Plaza, New York, NY 10001',
    latitude: 40.7589,
    longitude: -73.9851,
    phone: '(555) 123-4567',
    website: 'https://example-autism-center.com',
    email: 'info@example-autism-center.com',
    description: 'Comprehensive autism diagnostic services for children and adolescents',
    services: ['ADOS-2 Assessment', 'Developmental Evaluation', 'Speech Assessment', 'Occupational Therapy Evaluation'],
    age_groups: ['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted: ['Medicaid', 'Blue Cross', 'Aetna', 'Private Pay'],
    rating: 4.5,
    verified: true
  },
  {
    name: 'Metro Developmental Assessment Center',
    type: 'diagnostic',
    address: '456 Health Street, Los Angeles, CA 90210',
    latitude: 34.0522,
    longitude: -118.2437,
    phone: '(555) 234-5678',
    website: 'https://metro-dev-center.com',
    email: 'contact@metro-dev-center.com',
    description: 'Early intervention and diagnostic services',
    services: ['Early Intervention', 'ADOS Assessment', 'Psychological Testing'],
    age_groups: ['0-3', '4-7'],
    insurance_accepted: ['Medicaid', 'Kaiser', 'Private Pay'],
    rating: 4.2,
    verified: true
  },
  {
    name: 'Bright Futures Therapy Center',
    type: 'therapy',
    address: '789 Therapy Lane, Chicago, IL 60601',
    latitude: 41.8781,
    longitude: -87.6298,
    phone: '(555) 345-6789',
    website: 'https://bright-futures-therapy.com',
    email: 'hello@bright-futures-therapy.com',
    description: 'ABA therapy and behavioral intervention services',
    services: ['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Social Skills Groups'],
    age_groups: ['4-7', '8-12', '13-18'],
    insurance_accepted: ['Medicaid', 'BCBS', 'UnitedHealth', 'Private Pay'],
    rating: 4.7,
    verified: true
  },
  {
    name: 'Spectrum Support Services',
    type: 'therapy',
    address: '321 Wellness Blvd, Houston, TX 77001',
    latitude: 29.7604,
    longitude: -95.3698,
    phone: '(555) 456-7890',
    website: 'https://spectrum-support.com',
    email: 'info@spectrum-support.com',
    description: 'Comprehensive therapy services for autism spectrum disorders',
    services: ['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Physical Therapy', 'Music Therapy'],
    age_groups: ['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted: ['Medicaid', 'Aetna', 'Cigna', 'Private Pay'],
    rating: 4.3,
    verified: true
  },
  {
    name: 'Autism Family Support Network',
    type: 'support',
    address: '654 Community Center Dr, Phoenix, AZ 85001',
    latitude: 33.4484,
    longitude: -112.0740,
    phone: '(555) 567-8901',
    website: 'https://autism-family-support.org',
    email: 'support@autism-family-support.org',
    description: 'Support groups and resources for families affected by autism',
    services: ['Parent Support Groups', 'Sibling Support', 'Family Counseling', 'Resource Navigation'],
    age_groups: ['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted: ['Free', 'Sliding Scale'],
    rating: 4.8,
    verified: true
  },
  {
    name: 'Spectrum Families United',
    type: 'support',
    address: '987 Hope Street, Philadelphia, PA 19101',
    latitude: 39.9526,
    longitude: -75.1652,
    phone: '(555) 678-9012',
    website: 'https://spectrum-families-united.org',
    email: 'connect@spectrum-families-united.org',
    description: 'Community support and advocacy for autism families',
    services: ['Support Groups', 'Advocacy Training', 'Community Events', 'Respite Care'],
    age_groups: ['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted: ['Free', 'Donations Welcome'],
    rating: 4.6,
    verified: true
  },
  {
    name: 'Autism Learning Academy',
    type: 'education',
    address: '147 Education Way, Seattle, WA 98101',
    latitude: 47.6062,
    longitude: -122.3321,
    phone: '(555) 789-0123',
    website: 'https://autism-learning-academy.edu',
    email: 'admissions@autism-learning-academy.edu',
    description: 'Specialized educational programs for students with autism',
    services: ['Special Education', 'Individualized Learning Plans', 'Transition Services', 'Life Skills Training'],
    age_groups: ['4-7', '8-12', '13-18'],
    insurance_accepted: ['Public Funding', 'Private Pay', 'Scholarships Available'],
    rating: 4.4,
    verified: true
  },
  {
    name: 'Inclusive Education Center',
    type: 'education',
    address: '258 Learning Circle, Miami, FL 33101',
    latitude: 25.7617,
    longitude: -80.1918,
    phone: '(555) 890-1234',
    website: 'https://inclusive-education-center.org',
    email: 'info@inclusive-education-center.org',
    description: 'Inclusive educational programs and teacher training',
    services: ['Inclusive Classrooms', 'Teacher Training', 'Curriculum Development', 'Parent Education'],
    age_groups: ['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted: ['Public Funding', 'Grants', 'Private Pay'],
    rating: 4.1,
    verified: true
  }
];

async function populateAutismCenters() {
  try {
    console.log('Starting to populate autism centers...');
    
    // First, check if the table exists and has the right structure
    const { data: existingCenters, error: fetchError } = await supabase
      .from('autism_centers')
      .select('id')
      .limit(1);
    
    if (fetchError) {
      console.error('Error accessing autism_centers table:', fetchError.message);
      console.log('Make sure you have run the database migration to create the autism_centers table.');
      return;
    }
    
    // Insert the sample centers
    const { data, error } = await supabase
      .from('autism_centers')
      .insert(sampleCenters)
      .select();
    
    if (error) {
      console.error('Error inserting autism centers:', error.message);
      return;
    }
    
    console.log(`Successfully inserted ${data.length} autism centers!`);
    console.log('Centers added:');
    data.forEach(center => {
      console.log(`- ${center.name} (${center.type}) in ${center.address}`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
populateAutismCenters();
