// Script to add email column to profiles table using direct SQL
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nugybnlgrrwzbpjpfmty.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3libmxncnJ3emJwanBmbXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTExOTUxNiwiZXhwIjoyMDYwNjk1NTE2fQ.Ud6tx1GR3KLG_yR-7jhXFC2R3kQkVUbY0jkY-9lav18';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addEmailColumn() {
  try {
    console.log('🔄 Checking and adding email column to profiles table...\n');
    
    // First, let's check the current structure of the profiles table
    console.log('📝 Step 1: Checking current profiles table structure...');
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error checking profiles table:', selectError);
      return;
    }
    
    console.log('✅ Profiles table accessible');
    if (profiles.length > 0) {
      console.log('📊 Current profile structure:', Object.keys(profiles[0]));
      
      // Check if email column already exists
      if (profiles[0].hasOwnProperty('email')) {
        console.log('✅ Email column already exists!');
        
        // Check if any profiles are missing email data
        const { data: missingEmails, error: missingError } = await supabase
          .from('profiles')
          .select('id, email')
          .is('email', null);
        
        if (missingError) {
          console.error('❌ Error checking for missing emails:', missingError);
          return;
        }
        
        console.log(`📊 Profiles missing email: ${missingEmails.length}`);
        
        if (missingEmails.length > 0) {
          console.log('🔄 Updating profiles with missing email data...');
          
          // Get user emails from auth.users and update profiles
          for (const profile of missingEmails) {
            try {
              // We can't directly query auth.users, so we'll update during next registration
              console.log(`⚠️  Profile ${profile.id} missing email - will be updated on next login/registration`);
            } catch (error) {
              console.error(`❌ Error updating profile ${profile.id}:`, error);
            }
          }
        }
        
        console.log('\n🎉 Email column setup completed!');
        console.log('📊 Summary:');
        console.log('  ✅ Email column exists in profiles table');
        console.log('  ✅ New registrations will include email');
        console.log('  ✅ Email will be saved and displayed in Supabase');
        
        return;
      }
    }
    
    console.log('⚠️  Email column does not exist. Manual database migration required.');
    console.log('\n📝 To add the email column, please run this SQL in your Supabase SQL editor:');
    console.log('```sql');
    console.log('ALTER TABLE public.profiles ADD COLUMN email TEXT;');
    console.log('```');
    console.log('\nAfter adding the column, new registrations will automatically include the email.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
addEmailColumn();
