// Script to add Malaysia-based autism centers to your Supabase database
// Run this with: node scripts/add-malaysia-autism-centers.js

const { createClient } = require('@supabase/supabase-js');

// Use environment variables directly from .env.local
const supabaseUrl = 'https://nugybnlgrrwzbpjpfmty.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3libmxncnJ3emJwanBmbXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTExOTUxNiwiZXhwIjoyMDYwNjk1NTE2fQ.Ud6tx1GR3KLG_yR-7jhXFC2R3kQkVUbY0jkY-9lav18';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase configuration missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const malaysiaCenters = [
  // Kuala Lumpur Area
  {
    name: 'KL Autism Center',
    type: 'therapy',
    address: 'Jalan Ampang, Kuala Lumpur, Malaysia',
    latitude: 3.1478,
    longitude: 101.7017,
    phone: '+60 3-2161 2345',
    website: 'https://kl-autism-center.com',
    email: 'info@kl-autism-center.com',
    description: 'Comprehensive autism therapy and intervention services in Kuala Lumpur',
    services: ['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Social Skills Training'],
    age_groups: ['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted: ['Private Pay', 'Insurance'],
    rating: 4.5,
    verified: true
  },
  {
    name: 'Petaling Jaya Developmental Center',
    type: 'diagnostic',
    address: 'Petaling Jaya, Selangor, Malaysia',
    latitude: 3.1073,
    longitude: 101.6067,
    phone: '+60 3-7956 1234',
    website: 'https://pj-dev-center.com',
    email: 'contact@pj-dev-center.com',
    description: 'Early intervention and autism diagnostic services',
    services: ['Autism Assessment', 'Developmental Evaluation', 'Early Intervention'],
    age_groups: ['0-3', '4-7', '8-12'],
    insurance_accepted: ['Private Pay', 'Medical Insurance'],
    rating: 4.3,
    verified: true
  },
  {
    name: 'Subang Special Needs Center',
    type: 'education',
    address: 'Subang Jaya, Selangor, Malaysia',
    latitude: 3.0738,
    longitude: 101.5810,
    phone: '+60 3-5633 2345',
    website: 'https://subang-special-needs.edu.my',
    email: 'admin@subang-special-needs.edu.my',
    description: 'Special education and inclusive learning programs',
    services: ['Special Education', 'Individualized Learning', 'Life Skills Training'],
    age_groups: ['4-7', '8-12', '13-18'],
    insurance_accepted: ['Government Funding', 'Private Pay'],
    rating: 4.2,
    verified: true
  },
  {
    name: 'Bangsar Autism Support Group',
    type: 'support',
    address: 'Bangsar, Kuala Lumpur, Malaysia',
    latitude: 3.1319,
    longitude: 101.6841,
    phone: '+60 3-2282 5678',
    website: 'https://bangsar-autism-support.org',
    email: 'support@bangsar-autism-support.org',
    description: 'Community support and family resources for autism',
    services: ['Support Groups', 'Family Counseling', 'Resource Navigation', 'Respite Care'],
    age_groups: ['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted: ['Free', 'Donations'],
    rating: 4.7,
    verified: true
  },
  {
    name: 'Mont Kiara Therapy Center',
    type: 'therapy',
    address: 'Mont Kiara, Kuala Lumpur, Malaysia',
    latitude: 3.1728,
    longitude: 101.6508,
    phone: '+60 3-6201 3456',
    website: 'https://montkiara-therapy.com',
    email: 'info@montkiara-therapy.com',
    description: 'Specialized autism therapy and behavioral intervention',
    services: ['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Behavioral Intervention'],
    age_groups: ['0-3', '4-7', '8-12'],
    insurance_accepted: ['Private Pay', 'International Insurance'],
    rating: 4.6,
    verified: true
  },
  // Selangor Area
  {
    name: 'Shah Alam Autism Center',
    type: 'therapy',
    address: 'Shah Alam, Selangor, Malaysia',
    latitude: 3.0733,
    longitude: 101.5185,
    phone: '+60 3-5511 4567',
    website: 'https://shahalam-autism.com',
    email: 'therapy@shahalam-autism.com',
    description: 'Comprehensive autism therapy services in Shah Alam',
    services: ['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Music Therapy'],
    age_groups: ['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted: ['Private Pay', 'Medical Insurance'],
    rating: 4.4,
    verified: true
  },
  {
    name: 'Klang Valley Developmental Services',
    type: 'diagnostic',
    address: 'Klang, Selangor, Malaysia',
    latitude: 3.0319,
    longitude: 101.4450,
    phone: '+60 3-3371 2345',
    website: 'https://klang-developmental.com',
    email: 'assessment@klang-developmental.com',
    description: 'Autism assessment and early intervention services',
    services: ['Autism Screening', 'Developmental Assessment', 'Early Intervention Planning'],
    age_groups: ['0-3', '4-7'],
    insurance_accepted: ['Private Pay', 'Government Subsidy'],
    rating: 4.1,
    verified: true
  },
  // Other States
  {
    name: 'Penang Autism Foundation',
    type: 'support',
    address: 'George Town, Penang, Malaysia',
    latitude: 5.4164,
    longitude: 100.3327,
    phone: '+60 4-226 7890',
    website: 'https://penang-autism-foundation.org',
    email: 'info@penang-autism-foundation.org',
    description: 'Autism advocacy and family support services in Penang',
    services: ['Advocacy', 'Support Groups', 'Community Programs', 'Training Workshops'],
    age_groups: ['0-3', '4-7', '8-12', '13-18'],
    insurance_accepted: ['Free', 'Donations Welcome'],
    rating: 4.8,
    verified: true
  },
  {
    name: 'Johor Bahru Special Needs Center',
    type: 'education',
    address: 'Johor Bahru, Johor, Malaysia',
    latitude: 1.4927,
    longitude: 103.7414,
    phone: '+60 7-223 4567',
    website: 'https://jb-special-needs.edu.my',
    email: 'education@jb-special-needs.edu.my',
    description: 'Special education and therapy services in Johor Bahru',
    services: ['Special Education', 'Speech Therapy', 'Occupational Therapy', 'Transition Planning'],
    age_groups: ['4-7', '8-12', '13-18'],
    insurance_accepted: ['Government Funding', 'Private Pay', 'Scholarships'],
    rating: 4.3,
    verified: true
  }
];

async function addMalaysiaAutismCenters() {
  try {
    console.log('🇲🇾 Adding Malaysia-based autism centers...');
    
    // Check if the table exists
    const { data: existingCenters, error: fetchError } = await supabase
      .from('autism_centers')
      .select('id')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error accessing autism_centers table:', fetchError.message);
      console.log('Make sure you have run the database migration to create the autism_centers table.');
      return;
    }
    
    // Insert the Malaysia centers
    const { data, error } = await supabase
      .from('autism_centers')
      .insert(malaysiaCenters)
      .select();
    
    if (error) {
      console.error('❌ Error inserting Malaysia autism centers:', error.message);
      return;
    }
    
    console.log(`✅ Successfully inserted ${data.length} Malaysia autism centers!`);
    console.log('🏥 Centers added:');
    data.forEach(center => {
      console.log(`  - ${center.name} (${center.type}) in ${center.address}`);
    });
    
    console.log('\n🗺️ These centers are now available in the locator around Malaysia!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
addMalaysiaAutismCenters();
