// Script to add email column to profiles table
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nugybnlgrrwzbpjpfmty.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51Z3libmxncnJ3emJwanBmbXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTExOTUxNiwiZXhwIjoyMDYwNjk1NTE2fQ.Ud6tx1GR3KLG_yR-7jhXFC2R3kQkVUbY0jkY-9lav18';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateProfilesSchema() {
  try {
    console.log('🔄 Adding email column to profiles table...\n');
    
    // Step 1: Add email column to profiles table
    console.log('📝 Step 1: Adding email column...');
    const { data: addColumnData, error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;'
    });
    
    if (addColumnError) {
      console.error('❌ Error adding email column:', addColumnError);
      return;
    }
    console.log('✅ Email column added successfully!');
    
    // Step 2: Update the trigger function
    console.log('\n📝 Step 2: Updating trigger function...');
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, display_name, email, email_verified)
        VALUES (
          NEW.id, 
          COALESCE(
            NEW.raw_user_meta_data->>'display_name',
            split_part(NEW.email, '@', 1)
          ),
          NEW.email,
          TRUE
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { data: triggerData, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: triggerSQL
    });
    
    if (triggerError) {
      console.error('❌ Error updating trigger function:', triggerError);
      return;
    }
    console.log('✅ Trigger function updated successfully!');
    
    // Step 3: Update existing profiles with email
    console.log('\n📝 Step 3: Updating existing profiles with email...');
    const updateSQL = `
      UPDATE public.profiles 
      SET email = auth.users.email
      FROM auth.users 
      WHERE profiles.id = auth.users.id 
      AND profiles.email IS NULL;
    `;
    
    const { data: updateData, error: updateError } = await supabase.rpc('exec_sql', {
      sql: updateSQL
    });
    
    if (updateError) {
      console.error('❌ Error updating existing profiles:', updateError);
      return;
    }
    console.log('✅ Existing profiles updated with email!');
    
    // Step 4: Verify the changes
    console.log('\n📝 Step 4: Verifying changes...');
    const { data: profiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, display_name, email, email_verified')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError);
      return;
    }
    
    console.log('✅ Verification successful! Sample profiles:');
    profiles.forEach((profile, index) => {
      console.log(`  ${index + 1}. Name: ${profile.display_name || 'N/A'}, Email: ${profile.email || 'N/A'}, Verified: ${profile.email_verified}`);
    });
    
    console.log('\n🎉 Schema update completed successfully!');
    console.log('📊 Changes made:');
    console.log('  ✅ Added email column to profiles table');
    console.log('  ✅ Updated trigger function to save email');
    console.log('  ✅ Updated existing profiles with email data');
    console.log('  ✅ Email will now be saved and displayed in Supabase');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the update
updateProfilesSchema();
